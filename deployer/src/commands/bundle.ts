/**
 * Bundle command - deploys an entire workforce package into a target project.
 */

import chalk from 'chalk';
import { getPackage, validatePackage } from '../registry/package-registry.js';
import { executeDeploy } from './deploy.js';
import type { DeployOptions } from '../types.js';

/**
 * Executes the bundle command.
 */
export async function executeBundle(
  targetPath: string,
  packageName: string,
  dryRun: boolean = false
): Promise<void> {
  console.log(chalk.bold(`\n  TheLibrary - Deploying Package: ${packageName}\n`));

  const pkg = await getPackage(packageName);
  if (!pkg) {
    console.log(chalk.red(`  Package "${packageName}" not found`));
    console.log(chalk.dim('  Run "speckit list packages" to see available packages'));
    return;
  }

  // Validate package contents
  const errors = await validatePackage(pkg);
  if (errors.length > 0) {
    console.log(chalk.red('  Package validation failed:'));
    for (const error of errors) {
      console.log(chalk.red(`    - ${error}`));
    }
    return;
  }

  console.log(chalk.dim(`  Package: ${pkg.name} v${pkg.version}`));
  console.log(chalk.dim(`  Description: ${pkg.description}`));
  console.log(chalk.dim(`  Agents: ${pkg.agents.join(', ') || 'none'}`));
  console.log(chalk.dim(`  Skills: ${pkg.skills.join(', ') || 'none'}`));
  console.log(chalk.dim(`  Templates: ${pkg.templates.join(', ') || 'none'}`));
  console.log('');

  const options: DeployOptions = {
    targetPath,
    profile: pkg.constitutionProfile,
    skills: pkg.skills,
    agents: pkg.agents,
    templates: pkg.templates,
    security: pkg.security,
    dryRun,
  };

  await executeDeploy(options);
}
