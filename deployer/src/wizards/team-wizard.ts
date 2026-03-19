/**
 * Team Creation Wizard - walks through bundling agents, specialties,
 * and templates into a workforce team for one-command deployment.
 */

import chalk from 'chalk';
import path from 'path';
import { ensureDir, writeJson, exists, getProjectRoot } from '../utils/file-ops.js';
import { ask, confirm, select, closePrompt } from './prompt-engine.js';
import { getAllAgents, getAllSpecialties, getAllTemplates } from '../registry/asset-registry.js';
import type { ConstitutionProfile, WorkforceTeam } from '../types.js';

/** Team wizard input (shared between CLI and API) */
export interface TeamWizardInput {
  name: string;
  description: string;
  agents: string[];
  specialties: string[];
  templates: string[];
  constitutionProfile: ConstitutionProfile;
  security: boolean;
}

/**
 * Runs the interactive CLI team wizard.
 */
export async function runTeamWizardCli(): Promise<void> {
  console.log(chalk.bold('\n  TheLibrary - Workforce Team Creation Wizard\n'));
  console.log(chalk.dim('  Bundle agents, specialties, and templates for one-command deployment.\n'));

  const name = await ask('  Team name (e.g. "sales-team")');
  const description = await ask('  Description');

  // Check if exists
  const teamDir = path.join(getProjectRoot(), 'Teams', name);
  if (await exists(teamDir)) {
    const overwrite = await confirm(`  Team "${name}" already exists. Overwrite?`, false);
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

  // Select specialties
  const allSpecialties = await getAllSpecialties();
  console.log(chalk.blue('\n  Select specialties to include:'));
  console.log(chalk.dim('  Enter specialty numbers separated by commas, or "all" for all specialties.'));
  allSpecialties.forEach((s, i) => console.log(chalk.dim(`    ${i + 1}. ${s.displayName}`)));
  const specialtyInput = await ask('  Specialty numbers (comma-separated, or "all")');

  let selectedSpecialties: string[];
  if (specialtyInput.toLowerCase() === 'all') {
    selectedSpecialties = allSpecialties.map((s) => s.name);
  } else {
    selectedSpecialties = specialtyInput
      .split(',')
      .map((s) => parseInt(s.trim(), 10) - 1)
      .filter((i) => i >= 0 && i < allSpecialties.length)
      .map((i) => allSpecialties[i].name);
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

  const input: TeamWizardInput = {
    name,
    description,
    agents: selectedAgents,
    specialties: selectedSpecialties,
    templates: selectedTemplates,
    constitutionProfile,
    security,
  };

  console.log(chalk.blue('\n  Generating team...'));
  await generateTeam(input);

  console.log(chalk.green(`\n  Team "${name}" created at Teams/${name}/`));
  console.log(chalk.dim(`  Agents: ${selectedAgents.length}`));
  console.log(chalk.dim(`  Specialties: ${selectedSpecialties.length}`));
  console.log(chalk.dim(`  Templates: ${selectedTemplates.length}`));
  console.log(chalk.dim(`  Profile: ${constitutionProfile}`));
  console.log(chalk.dim(`  Security: ${security ? 'yes' : 'no'}`));
  console.log(chalk.dim(`\n  Deploy with: speckit bundle /path/to/project ${name}\n`));

  closePrompt();
}

/**
 * Generates a team definition from wizard input (used by both CLI and API).
 */
export async function generateTeam(input: TeamWizardInput): Promise<string> {
  const teamDir = path.join(getProjectRoot(), 'Teams', input.name);
  await ensureDir(teamDir);

  const team: WorkforceTeam = {
    name: input.name,
    description: input.description,
    version: '1.0.0',
    agents: input.agents,
    specialties: input.specialties,
    templates: input.templates,
    mcpServers: [],
    constitutionProfile: input.constitutionProfile,
    security: input.security,
  };

  await writeJson(path.join(teamDir, 'package.json'), team);

  return teamDir;
}
