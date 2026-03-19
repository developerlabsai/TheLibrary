/**
 * Deploy command - orchestrates the full deployment of SpecKit, Beads,
 * agents, skills, MCP, and templates into a target project.
 */

import chalk from 'chalk';
import type { DeployOptions, ProjectProfile } from '../types.js';
import { analyzeProject } from '../analyzers/project-analyzer.js';
import { deploySpeckit } from '../deployers/speckit-deployer.js';
import { deployBeads } from '../deployers/beads-deployer.js';
import { deploySecurity } from '../deployers/security-deployer.js';
import { deploySkills } from '../deployers/skill-deployer.js';
import { deployAgents } from '../deployers/agent-deployer.js';
import { deployTemplates } from '../deployers/template-deployer.js';
import { deployMcpInfra } from '../deployers/mcp-deployer.js';
import { generateConstitution } from '../generators/constitution.js';
import { generateAgentContext } from '../generators/agent-context.js';
import { generateSettings } from '../generators/settings-generator.js';
import { createVersionStamp, writeVersionStamp } from '../utils/version.js';

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

  // Step 8: Deploy skills (if specified)
  if (options.skills && options.skills.length > 0) {
    console.log(chalk.blue('\n  Step 8: Deploying skills...'));
    const skillsResult = await deploySkills(options.skills, options);
    printResult('Skills', skillsResult.deployed, skillsResult.skipped, skillsResult.warnings);
  }

  // Step 9: Deploy agents (if specified)
  if (options.agents && options.agents.length > 0) {
    console.log(chalk.blue('\n  Step 9: Deploying agents...'));
    const agentsResult = await deployAgents(options.agents, options);
    printResult('Agents', agentsResult.deployed, agentsResult.skipped, agentsResult.warnings);
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
      Object.fromEntries((options.skills || []).map((s) => [s, '1.0.0'])),
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
