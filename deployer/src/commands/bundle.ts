/**
 * Bundle command - deploys an entire workforce team into a target project.
 */

import chalk from 'chalk';
import { getTeam, validateTeam } from '../registry/team-registry.js';
import { executeDeploy } from './deploy.js';
import type { DeployOptions } from '../types.js';

/**
 * Executes the bundle command.
 */
export async function executeBundle(
  targetPath: string,
  teamName: string,
  dryRun: boolean = false
): Promise<void> {
  console.log(chalk.bold(`\n  TheLibrary - Deploying Team: ${teamName}\n`));

  const pkg = await getTeam(teamName);
  if (!pkg) {
    console.log(chalk.red(`  Team "${teamName}" not found`));
    console.log(chalk.dim('  Run "speckit list teams" to see available teams'));
    return;
  }

  // Validate team contents
  const errors = await validateTeam(pkg);
  if (errors.length > 0) {
    console.log(chalk.red('  Team validation failed:'));
    for (const error of errors) {
      console.log(chalk.red(`    - ${error}`));
    }
    return;
  }

  console.log(chalk.dim(`  Team: ${pkg.name} v${pkg.version}`));
  console.log(chalk.dim(`  Description: ${pkg.description}`));
  console.log(chalk.dim(`  Agents: ${pkg.agents.join(', ') || 'none'}`));
  console.log(chalk.dim(`  Specialties: ${pkg.specialties.join(', ') || 'none'}`));
  console.log(chalk.dim(`  Templates: ${pkg.templates.join(', ') || 'none'}`));
  console.log('');

  const options: DeployOptions = {
    targetPath,
    profile: pkg.constitutionProfile,
    specialties: pkg.specialties,
    agents: pkg.agents,
    templates: pkg.templates,
    security: pkg.security,
    dryRun,
  };

  await executeDeploy(options);
}
