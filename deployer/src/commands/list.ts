/**
 * List command - displays available assets in TheLibrary.
 */

import chalk from 'chalk';
import { getAllAgents, getAllSkills, getAllTemplates, getAllPackages } from '../registry/asset-registry.js';

type AssetType = 'agents' | 'skills' | 'templates' | 'packages' | 'profiles' | 'all';

/**
 * Executes the list command.
 */
export async function executeList(type: AssetType): Promise<void> {
  console.log(chalk.bold('\n  TheLibrary - Available Assets\n'));

  if (type === 'agents' || type === 'all') await listAgents();
  if (type === 'skills' || type === 'all') await listSkills();
  if (type === 'templates' || type === 'all') await listTemplates();
  if (type === 'packages' || type === 'all') await listPackages();
  if (type === 'profiles' || type === 'all') listProfiles();

  console.log('');
}

async function listAgents(): Promise<void> {
  const agents = await getAllAgents();
  console.log(chalk.blue(`  Agents (${agents.length}):`));
  if (agents.length === 0) {
    console.log(chalk.dim('    No agents found'));
    return;
  }
  for (const agent of agents) {
    console.log(`    ${chalk.bold(agent.name)} - ${agent.description}`);
    if (agent.requiredSkills.length > 0) {
      console.log(chalk.dim(`      Skills: ${agent.requiredSkills.join(', ')}`));
    }
    if (agent.tags.length > 0) {
      console.log(chalk.dim(`      Tags: ${agent.tags.join(', ')}`));
    }
  }
  console.log('');
}

async function listSkills(): Promise<void> {
  const skills = await getAllSkills();
  console.log(chalk.blue(`  Skills (${skills.length}):`));
  if (skills.length === 0) {
    console.log(chalk.dim('    No skills found'));
    return;
  }
  for (const skill of skills) {
    const refTag = skill.hasReference ? chalk.dim(' [+ref]') : '';
    console.log(`    ${chalk.bold(skill.name)} - ${skill.description || skill.displayName}${refTag}`);
  }
  console.log('');
}

async function listTemplates(): Promise<void> {
  const templates = await getAllTemplates();
  console.log(chalk.blue(`  Templates (${templates.length}):`));
  if (templates.length === 0) {
    console.log(chalk.dim('    No templates found'));
    return;
  }
  for (const template of templates) {
    console.log(`    ${template}`);
  }
  console.log('');
}

async function listPackages(): Promise<void> {
  const packages = await getAllPackages();
  console.log(chalk.blue(`  Workforce Packages (${packages.length}):`));
  if (packages.length === 0) {
    console.log(chalk.dim('    No packages found'));
    return;
  }
  for (const pkg of packages) {
    console.log(`    ${chalk.bold(pkg.name)} - ${pkg.description}`);
    console.log(chalk.dim(`      Agents: ${pkg.agents.length} | Skills: ${pkg.skills.length} | Templates: ${pkg.templates.length}`));
  }
  console.log('');
}

function listProfiles(): void {
  console.log(chalk.blue('  Constitution Profiles:'));
  const profiles = [
    { name: 'web-app-typescript', desc: 'Next.js, Express, React apps' },
    { name: 'web-app-python', desc: 'Django, FastAPI, Flask' },
    { name: 'slack-bot', desc: 'Slack apps and bots' },
    { name: 'api-service', desc: 'REST/GraphQL APIs' },
    { name: 'cli-tool', desc: 'CLI utilities and tools' },
    { name: 'minimal', desc: 'Lightweight, any project' },
  ];
  for (const p of profiles) {
    console.log(`    ${chalk.bold(p.name)} - ${p.desc}`);
  }
  console.log('');
}
