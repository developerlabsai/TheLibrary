/**
 * Deploy command - orchestrates the full deployment of SpecKit, Beads,
 * agents, specialties, MCP, and templates into a target project.
 */

import chalk from 'chalk';
import type { DeployOptions, ProjectProfile } from '../types.js';
import { analyzeProject } from '../analyzers/project-analyzer.js';
import { deploySpeckit } from '../deployers/speckit-deployer.js';
import { deployBeads } from '../deployers/beads-deployer.js';
import { deploySecurity } from '../deployers/security-deployer.js';
import { deploySpecialties } from '../deployers/specialty-deployer.js';
import { deployAgents } from '../deployers/agent-deployer.js';
import { deployTemplates } from '../deployers/template-deployer.js';
import { deployMcpInfra } from '../deployers/mcp-deployer.js';
import { generateConstitution } from '../generators/constitution.js';
import { generateAgentContext } from '../generators/agent-context.js';
import { generateSettings } from '../generators/settings-generator.js';
import { createVersionStamp, writeVersionStamp } from '../utils/version.js';
import { checkEntitlement } from '../license/entitlement-checker.js';
import { fetchAsset, RegistryClientError } from '../registry/registry-client.js';
import { getCredentials } from '../license/credential-store.js';
import type { LicenseTier } from '../types.js';

/**
 * Executes the full deploy command.
 */
export async function executeDeploy(options: DeployOptions): Promise<void> {
  const dryRun = options.dryRun ?? false;

  console.log(chalk.bold('\n  TheLibrary - SpecKit Deployer\n'));

  if (dryRun) {
    console.log(chalk.yellow('  DRY RUN - No files will be modified\n'));
  }

  // Step 1: Analyze target project
  console.log(chalk.blue('  Step 1: Analyzing target project...'));
  const profile = await analyzeProject(options.targetPath);
  printAnalysis(profile);

  // Override profile if specified
  if (options.profile) {
    profile.suggestedProfile = options.profile;
  }

  // Step 2: Deploy .specify/ structure
  console.log(chalk.blue('\n  Step 2: Deploying SpecKit structure...'));
  const speckitResult = await deploySpeckit(profile, options);
  printResult('SpecKit', speckitResult.created, speckitResult.skipped, speckitResult.warnings);

  // Step 3: Generate constitution
  console.log(chalk.blue('\n  Step 3: Generating constitution...'));
  const constitutionResult = await generateConstitution(profile, options.targetPath, dryRun);
  if (constitutionResult.created) {
    console.log(chalk.green('    Created constitution.md'));
  } else {
    console.log(chalk.dim('    Constitution already exists - preserved'));
  }
  for (const w of constitutionResult.warnings) {
    console.log(chalk.yellow(`    Warning: ${w}`));
  }

  // Step 4: Generate agent context
  console.log(chalk.blue('\n  Step 4: Generating agent context...'));
  const contextResult = await generateAgentContext(profile, options.targetPath, dryRun);
  if (contextResult.created) {
    console.log(chalk.green('    Created agent-context-claude.md'));
  } else {
    console.log(chalk.dim('    Agent context already exists - preserved'));
  }

  // Step 5: Deploy .beads/
  console.log(chalk.blue('\n  Step 5: Deploying Beads...'));
  const beadsResult = await deployBeads(profile, options);
  printResult('Beads', beadsResult.created, beadsResult.skipped, beadsResult.warnings);

  // Step 6: Generate/merge .claude/settings.local.json
  console.log(chalk.blue('\n  Step 6: Configuring Claude settings...'));
  const settingsResult = await generateSettings(profile, options.targetPath, dryRun);
  if (settingsResult.created) {
    console.log(chalk.green('    Created settings.local.json'));
  } else if (settingsResult.merged) {
    console.log(chalk.green('    Merged SpecKit permissions into existing settings'));
  } else {
    console.log(chalk.dim('    Settings already up to date'));
  }

  // Step 7: Deploy security baseline (if requested)
  if (options.security) {
    console.log(chalk.blue('\n  Step 7: Deploying security baseline...'));
    const securityResult = await deploySecurity(profile, options);
    printResult('Security', securityResult.created, securityResult.skipped);
  }

  // Step 8: Deploy specialties (if specified)
  // For each specialty/agent, check if it's a local free asset or requires registry fetch.
  // If registry: validate entitlement, fetch from registry, deploy.
  // Mid-deployment revocation: if key revoked between fetches, fail gracefully for remaining assets.
  if (options.specialties && options.specialties.length > 0) {
    console.log(chalk.blue('\n  Step 8: Deploying specialties...'));
    const { local, remote } = await partitionAssets(options.specialties, 'specialty');
    if (local.length > 0) {
      const specialtiesResult = await deploySpecialties(local, options);
      printResult('Specialties (local)', specialtiesResult.deployed, specialtiesResult.skipped, specialtiesResult.warnings);
    }
    for (const name of remote) {
      await deployRemoteAsset(name, 'specialty', options, dryRun);
    }
  }

  // Step 9: Deploy agents (if specified)
  if (options.agents && options.agents.length > 0) {
    console.log(chalk.blue('\n  Step 9: Deploying agents...'));
    const { local, remote } = await partitionAssets(options.agents, 'agent');
    if (local.length > 0) {
      const agentsResult = await deployAgents(local, options);
      printResult('Agents (local)', agentsResult.deployed, agentsResult.skipped, agentsResult.warnings);
    }
    for (const name of remote) {
      await deployRemoteAsset(name, 'agent', options, dryRun);
    }
  }

  // Step 10: Deploy templates (if specified)
  if (options.templates && options.templates.length > 0) {
    console.log(chalk.blue('\n  Step 10: Deploying templates...'));
    const templatesResult = await deployTemplates(options.templates, options);
    printResult('Templates', templatesResult.deployed, templatesResult.skipped, templatesResult.warnings);
  }

  // Step 11: Deploy feature specs (if specified)
  if (options.features && options.features.length > 0) {
    console.log(chalk.blue('\n  Step 11: Deploying feature specs...'));
    const { deployFeatureSpecs } = await import('../deployers/feature-deployer.js');
    const featuresResult = await deployFeatureSpecs(options.features, options);
    printResult('Features', featuresResult.deployed, featuresResult.skipped, featuresResult.warnings);
  }

  // Step 12: Stamp version
  if (!dryRun) {
    console.log(chalk.blue('\n  Stamping version...'));
    const stamp = createVersionStamp(
      profile.suggestedProfile,
      Object.fromEntries((options.specialties || []).map((s) => [s, '1.0.0'])),
      Object.fromEntries((options.agents || []).map((a) => [a, '1.0.0'])),
      options.templates || []
    );
    await writeVersionStamp(options.targetPath, stamp);
    console.log(chalk.green('    Created speckit-version.json'));
  }

  // Summary
  console.log(chalk.bold.green('\n  Deployment complete!'));
  console.log(chalk.dim(`  Profile: ${profile.suggestedProfile}`));
  console.log(chalk.dim(`  Target: ${options.targetPath}`));

  if (!dryRun) {
    console.log(chalk.dim('\n  Review changes and commit when ready.'));
  }
  console.log('');
}

function printAnalysis(profile: ProjectProfile): void {
  console.log(chalk.dim(`    Project: ${profile.projectName}`));
  console.log(chalk.dim(`    Language: ${profile.language || 'unknown'}`));
  console.log(chalk.dim(`    Framework: ${profile.framework || 'none detected'}`));
  console.log(chalk.dim(`    Profile: ${profile.suggestedProfile}`));
  console.log(chalk.dim(`    Git: ${profile.hasGit ? 'yes' : 'no'}`));
  console.log(chalk.dim(`    Existing SpecKit: ${profile.hasSpecKit ? 'yes' : 'no'}`));
  console.log(chalk.dim(`    Existing Beads: ${profile.hasBeads ? 'yes' : 'no'}`));
  console.log(chalk.dim(`    Existing Claude: ${profile.hasClaude ? 'yes' : 'no'}`));
}

/**
 * Partitions asset names into local (available in library) and remote (need registry).
 * When an asset exists both locally and remotely, authenticated users get the registry version.
 */
async function partitionAssets(
  names: string[],
  type: 'agent' | 'specialty'
): Promise<{ local: string[]; remote: string[] }> {
  const { getAllAgents, getAllSpecialties } = await import('../registry/asset-registry.js');
  const localNames = type === 'agent'
    ? (await getAllAgents()).map(a => a.name)
    : (await getAllSpecialties()).map(s => s.name);

  const credentials = await getCredentials();
  const local: string[] = [];
  const remote: string[] = [];

  for (const name of names) {
    const isLocal = localNames.includes(name);
    // If authenticated and asset exists remotely, prefer registry version
    if (credentials && !isLocal) {
      remote.push(name);
    } else if (credentials && isLocal) {
      // Asset exists locally — use local version for free assets
      // Registry version takes precedence for authenticated users with entitlement
      // For now, use local by default; registry-client will override if entitled
      local.push(name);
    } else {
      local.push(name);
    }
  }

  return { local, remote };
}

/**
 * Deploys a single remote asset from the registry.
 * For enterprise-tier assets (or when --stub is set), deploys a thin stub.
 * Handles entitlement checking and error messages per US3 acceptance scenarios.
 */
async function deployRemoteAsset(
  name: string,
  assetType: string,
  options: DeployOptions,
  dryRun: boolean
): Promise<void> {
  // Check entitlement
  const entitlement = await checkEntitlement(name, 'pro' as LicenseTier);
  if (!entitlement.allowed) {
    console.log(chalk.yellow(`    ${name}: ${entitlement.message}`));
    return;
  }

  if (dryRun) {
    const mode = options.stub ? 'stub' : 'full';
    console.log(chalk.dim(`    ${name}: would deploy as ${mode} from registry (dry run)`));
    return;
  }

  // Enterprise-tier or --stub flag: deploy as thin stub
  if (options.stub || entitlement.current_tier === 'enterprise') {
    try {
      const { deployStub } = await import('../stubs/stub-deployer.js');
      const stubPath = await deployStub(
        name,
        options.version,
        options.targetPath,
        undefined,
        options.ttl
      );
      console.log(chalk.green(`    ${name}: deployed as stub → ${stubPath}`));
    } catch {
      console.log(chalk.red(`    ${name}: Failed to deploy stub`));
    }
    return;
  }

  // Pro-tier: fetch full content
  try {
    const result = await fetchAsset(name, options.version);
    console.log(chalk.green(`    ${name}: fetched v${result.version} from registry`));
    // TODO: Extract and deploy content archive to target path
  } catch (err) {
    if (err instanceof RegistryClientError) {
      console.log(chalk.red(`    ${name}: ${err.userMessage}`));
    } else {
      console.log(chalk.red(`    ${name}: Failed to fetch from registry — check your network connection`));
    }
  }
}

function printResult(
  label: string,
  created: string[],
  skipped: string[],
  warnings: string[] = []
): void {
  if (created.length > 0) {
    console.log(chalk.green(`    ${label}: ${created.length} created`));
    for (const item of created) {
      console.log(chalk.dim(`      + ${item}`));
    }
  }
  if (skipped.length > 0) {
    console.log(chalk.dim(`    ${label}: ${skipped.length} skipped (already exist)`));
  }
  for (const w of warnings) {
    console.log(chalk.yellow(`    Warning: ${w}`));
  }
}
