/**
 * List command - displays available assets in TheLibrary.
 */

import chalk from 'chalk';
import { getAllAgents, getAllSpecialties, getAllTemplates, getAllTeams, getRemoteCatalog } from '../registry/asset-registry.js';
import { getCredentials } from '../license/credential-store.js';
import type { CatalogEntry } from '../types.js';

type AssetType = 'agents' | 'specialties' | 'templates' | 'teams' | 'profiles' | 'all';

/**
 * Executes the list command.
 */
export async function executeList(type: AssetType): Promise<void> {
  console.log(chalk.bold('\n  TheLibrary - Available Assets\n'));

  if (type === 'agents' || type === 'all') await listAgents();
  if (type === 'specialties' || type === 'all') await listSpecialties();
  if (type === 'templates' || type === 'all') await listTemplates();
  if (type === 'teams' || type === 'all') await listTeams();
  if (type === 'profiles' || type === 'all') listProfiles();

  // Show licensed assets from registry if authenticated
  const credentials = await getCredentials();
  if (credentials) {
    await listRegistryAssets();
  }

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
    if (agent.requiredSpecialties.length > 0) {
      console.log(chalk.dim(`      Specialties: ${agent.requiredSpecialties.join(', ')}`));
    }
    if (agent.tags.length > 0) {
      console.log(chalk.dim(`      Tags: ${agent.tags.join(', ')}`));
    }
  }
  console.log('');
}

async function listSpecialties(): Promise<void> {
  const specialties = await getAllSpecialties();
  console.log(chalk.blue(`  Specialties (${specialties.length}):`));
  if (specialties.length === 0) {
    console.log(chalk.dim('    No specialties found'));
    return;
  }
  for (const specialty of specialties) {
    const refTag = specialty.hasReference ? chalk.dim(' [+ref]') : '';
    console.log(`    ${chalk.bold(specialty.name)} - ${specialty.description || specialty.displayName}${refTag}`);
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

async function listTeams(): Promise<void> {
  const teams = await getAllTeams();
  console.log(chalk.blue(`  Workforce Teams (${teams.length}):`));
  if (teams.length === 0) {
    console.log(chalk.dim('    No teams found'));
    return;
  }
  for (const pkg of teams) {
    console.log(`    ${chalk.bold(pkg.name)} - ${pkg.description}`);
    console.log(chalk.dim(`      Agents: ${pkg.agents.length} | Specialties: ${pkg.specialties.length} | Templates: ${pkg.templates.length}`));
  }
  console.log('');
}

/**
 * Lists assets available from the remote registry for authenticated users.
 */
async function listRegistryAssets(): Promise<void> {
  const catalog = await getRemoteCatalog();
  if (catalog.length === 0) return;

  console.log(chalk.blue(`  Registry Assets (${catalog.length}):`));
  for (const entry of catalog) {
    const tierBadge = entry.tier === 'enterprise'
      ? chalk.magenta(`[${entry.tier}]`)
      : chalk.cyan(`[${entry.tier}]`);
    const entitledTag = entry.entitled ? chalk.green(' [entitled]') : chalk.dim(' [not entitled]');
    console.log(`    ${chalk.bold(entry.name)} ${tierBadge}${entitledTag} - ${entry.description}`);
    console.log(chalk.dim(`      Type: ${entry.type} | Version: ${entry.current_version}`));
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
