/**
 * Package Creation Wizard - walks through bundling agents, skills,
 * and templates into a workforce package for one-command deployment.
 */

import chalk from 'chalk';
import path from 'path';
import { ensureDir, writeJson, exists, getProjectRoot } from '../utils/file-ops.js';
import { ask, confirm, select, closePrompt } from './prompt-engine.js';
import { getAllAgents, getAllSkills, getAllTemplates } from '../registry/asset-registry.js';
import type { ConstitutionProfile, WorkforcePackage } from '../types.js';

/** Package wizard input (shared between CLI and API) */
export interface PackageWizardInput {
  name: string;
  description: string;
  agents: string[];
  skills: string[];
  templates: string[];
  constitutionProfile: ConstitutionProfile;
  security: boolean;
}

/**
 * Runs the interactive CLI package wizard.
 */
export async function runPackageWizardCli(): Promise<void> {
  console.log(chalk.bold('\n  TheLibrary - Workforce Package Creation Wizard\n'));
  console.log(chalk.dim('  Bundle agents, skills, and templates for one-command deployment.\n'));

  const name = await ask('  Package name (e.g. "sales-team")');
  const description = await ask('  Description');

  // Check if exists
  const pkgDir = path.join(getProjectRoot(), 'Packages', name);
  if (await exists(pkgDir)) {
    const overwrite = await confirm(`  Package "${name}" already exists. Overwrite?`, false);
    if (!overwrite) {
      console.log(chalk.dim('  Cancelled.'));
      closePrompt();
      return;
    }
  }

  // Select agents
  const allAgents = await getAllAgents();
  console.log(chalk.blue('\n  Select agents to include:'));
  const selectedAgents: string[] = [];
  for (const agent of allAgents) {
    const include = await confirm(`    Include ${agent.displayName}?`, false);
    if (include) selectedAgents.push(agent.name);
  }

  // Select skills
  const allSkills = await getAllSkills();
  console.log(chalk.blue('\n  Select skills to include:'));
  console.log(chalk.dim('  Enter skill numbers separated by commas, or "all" for all skills.'));
  allSkills.forEach((s, i) => console.log(chalk.dim(`    ${i + 1}. ${s.displayName}`)));
  const skillInput = await ask('  Skill numbers (comma-separated, or "all")');

  let selectedSkills: string[];
  if (skillInput.toLowerCase() === 'all') {
    selectedSkills = allSkills.map((s) => s.name);
  } else {
    selectedSkills = skillInput
      .split(',')
      .map((s) => parseInt(s.trim(), 10) - 1)
      .filter((i) => i >= 0 && i < allSkills.length)
      .map((i) => allSkills[i].name);
  }

  // Select templates
  const allTemplates = await getAllTemplates();
  console.log(chalk.blue('\n  Select templates to include:'));
  console.log(chalk.dim('  Enter template numbers separated by commas, or "all".'));
  allTemplates.forEach((t, i) => console.log(chalk.dim(`    ${i + 1}. ${t}`)));
  const templateInput = await ask('  Template numbers (comma-separated, "all", or blank for none)');

  let selectedTemplates: string[];
  if (templateInput.toLowerCase() === 'all') {
    selectedTemplates = allTemplates;
  } else if (!templateInput) {
    selectedTemplates = [];
  } else {
    selectedTemplates = templateInput
      .split(',')
      .map((s) => parseInt(s.trim(), 10) - 1)
      .filter((i) => i >= 0 && i < allTemplates.length)
      .map((i) => allTemplates[i]);
  }

  // Constitution profile
  const constitutionProfile = (await select('  Default constitution profile:', [
    'web-app-typescript',
    'web-app-python',
    'slack-bot',
    'api-service',
    'cli-tool',
    'minimal',
  ])) as ConstitutionProfile;

  const security = await confirm('  Include security baseline?', true);

  const input: PackageWizardInput = {
    name,
    description,
    agents: selectedAgents,
    skills: selectedSkills,
    templates: selectedTemplates,
    constitutionProfile,
    security,
  };

  console.log(chalk.blue('\n  Generating package...'));
  await generatePackage(input);

  console.log(chalk.green(`\n  Package "${name}" created at Packages/${name}/`));
  console.log(chalk.dim(`  Agents: ${selectedAgents.length}`));
  console.log(chalk.dim(`  Skills: ${selectedSkills.length}`));
  console.log(chalk.dim(`  Templates: ${selectedTemplates.length}`));
  console.log(chalk.dim(`  Profile: ${constitutionProfile}`));
  console.log(chalk.dim(`  Security: ${security ? 'yes' : 'no'}`));
  console.log(chalk.dim(`\n  Deploy with: speckit bundle /path/to/project ${name}\n`));

  closePrompt();
}

/**
 * Generates a package definition from wizard input (used by both CLI and API).
 */
export async function generatePackage(input: PackageWizardInput): Promise<string> {
  const pkgDir = path.join(getProjectRoot(), 'Packages', input.name);
  await ensureDir(pkgDir);

  const pkg: WorkforcePackage = {
    name: input.name,
    description: input.description,
    version: '1.0.0',
    agents: input.agents,
    skills: input.skills,
    templates: input.templates,
    mcpServers: [],
    constitutionProfile: input.constitutionProfile,
    security: input.security,
  };

  await writeJson(path.join(pkgDir, 'package.json'), pkg);

  return pkgDir;
}
