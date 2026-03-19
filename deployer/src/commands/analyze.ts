/**
 * Analyze command - inspects a target project without modifying it.
 */

import chalk from 'chalk';
import { analyzeProject } from '../analyzers/project-analyzer.js';

/**
 * Executes the analyze command.
 */
export async function executeAnalyze(targetPath: string, json: boolean = false): Promise<void> {
  const profile = await analyzeProject(targetPath);

  if (json) {
    console.log(JSON.stringify(profile, null, 2));
    return;
  }

  console.log(chalk.bold('\n  TheLibrary - Project Analysis\n'));
  console.log(`  ${chalk.dim('Project:')}      ${profile.projectName}`);
  console.log(`  ${chalk.dim('Path:')}         ${profile.projectPath}`);
  console.log(`  ${chalk.dim('Language:')}     ${profile.language || chalk.yellow('unknown')}`);
  console.log(`  ${chalk.dim('Framework:')}    ${profile.framework || chalk.yellow('none detected')}`);
  console.log(`  ${chalk.dim('Test framework:')} ${profile.testFramework || chalk.yellow('none detected')}`);
  console.log(`  ${chalk.dim('Database:')}     ${profile.database || chalk.yellow('none detected')}`);
  console.log(`  ${chalk.dim('CI/CD:')}        ${profile.cicd || chalk.yellow('none detected')}`);
  console.log('');
  console.log(`  ${chalk.dim('Git repo:')}     ${profile.hasGit ? chalk.green('yes') : chalk.yellow('no')}`);
  console.log(`  ${chalk.dim('SpecKit:')}      ${profile.hasSpecKit ? chalk.green('installed') : chalk.dim('not installed')}`);
  console.log(`  ${chalk.dim('Beads:')}        ${profile.hasBeads ? chalk.green('installed') : chalk.dim('not installed')}`);
  console.log(`  ${chalk.dim('Claude:')}       ${profile.hasClaude ? chalk.green('configured') : chalk.dim('not configured')}`);
  console.log(`  ${chalk.dim('MCP infra:')}    ${profile.hasMcpInfra ? chalk.green('installed') : chalk.dim('not installed')}`);
  console.log('');
  console.log(`  ${chalk.dim('Suggested profile:')} ${chalk.bold(profile.suggestedProfile)}`);

  if (profile.existingSkills.length > 0) {
    console.log(`\n  ${chalk.dim('Existing skills:')} ${profile.existingSkills.join(', ')}`);
  }
  if (profile.existingMcpServers.length > 0) {
    console.log(`  ${chalk.dim('Existing MCP:')} ${profile.existingMcpServers.join(', ')}`);
  }

  console.log('');
}
