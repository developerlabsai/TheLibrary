#!/usr/bin/env tsx
/**
 * TheLibrary - SpecKit Deployer CLI
 *
 * Uniform deployment of SpecKit, Beads, Agents, Specialties, MCP Servers,
 * and Templates into any project.
 */

import { Command } from 'commander';
import { executeDeploy } from '../src/commands/deploy.js';
import { executeAnalyze } from '../src/commands/analyze.js';
import { executeList } from '../src/commands/list.js';
import { executeBundle } from '../src/commands/bundle.js';
import type { ConstitutionProfile, DeployOptions } from '../src/types.js';

const program = new Command();

program
  .name('speckit')
  .description('TheLibrary - SpecKit Deployer. Uniform deployment of agents, specialties, MCP servers, and templates.')
  .version('1.0.0');

// ── analyze ──────────────────────────────────────────────────────────

program
  .command('analyze <target-path>')
  .description('Analyze a target project without modifying it')
  .option('--json', 'Output as JSON')
  .action(async (targetPath: string, opts: { json?: boolean }) => {
    await executeAnalyze(targetPath, opts.json);
  });

// ── deploy ───────────────────────────────────────────────────────────

program
  .command('deploy <target-path>')
  .description('Deploy SpecKit + Beads into a target project')
  .option('--profile <profile>', 'Constitution profile (web-app-typescript, web-app-python, slack-bot, api-service, cli-tool, minimal)')
  .option('--specialties <specialties>', 'Comma-separated list of specialties to deploy')
  .option('--agents <agents>', 'Comma-separated list of agents to deploy')
  .option('--templates <templates>', 'Comma-separated list of templates to deploy')
  .option('--security', 'Deploy security baseline module')
  .option('--dry-run', 'Preview what would be deployed without making changes')
  .option('--force', 'Force overwrite existing files')
  .option('--scaffold', 'Scaffold a fresh project (equivalent to deploy into empty directory)')
  .option('--version <version>', 'Pin registry assets to a specific version')
  .action(async (targetPath: string, opts: {
    profile?: string;
    specialties?: string;
    agents?: string;
    templates?: string;
    security?: boolean;
    dryRun?: boolean;
    force?: boolean;
    scaffold?: boolean;
    version?: string;
  }) => {
    const options: DeployOptions = {
      targetPath,
      profile: opts.profile as ConstitutionProfile | undefined,
      specialties: opts.specialties?.split(',').map((s) => s.trim()),
      agents: opts.agents?.split(',').map((s) => s.trim()),
      templates: opts.templates?.split(',').map((s) => s.trim()),
      security: opts.security,
      dryRun: opts.dryRun,
      force: opts.force,
      scaffold: opts.scaffold,
      version: opts.version,
    };
    await executeDeploy(options);
  });

// ── scaffold ─────────────────────────────────────────────────────────

program
  .command('scaffold <target-path>')
  .description('Scaffold a fresh project with full SpecKit installation')
  .option('--profile <profile>', 'Constitution profile')
  .option('--security', 'Include security baseline')
  .action(async (targetPath: string, opts: { profile?: string; security?: boolean }) => {
    const options: DeployOptions = {
      targetPath,
      profile: opts.profile as ConstitutionProfile | undefined,
      security: opts.security ?? true,
      scaffold: true,
    };
    await executeDeploy(options);
  });

// ── bundle ───────────────────────────────────────────────────────────

program
  .command('bundle <target-path> <team-name>')
  .description('Deploy an entire workforce team')
  .option('--dry-run', 'Preview without making changes')
  .action(async (targetPath: string, teamName: string, opts: { dryRun?: boolean }) => {
    await executeBundle(targetPath, teamName, opts.dryRun);
  });

// ── list ─────────────────────────────────────────────────────────────

program
  .command('list [type]')
  .description('List available assets (agents, specialties, templates, teams, profiles, all)')
  .action(async (type: string = 'all') => {
    await executeList(type as any);
  });

// ── deploy-specialty ─────────────────────────────────────────────────

program
  .command('deploy-specialty <target-path> <specialty-name>')
  .description('Deploy a single specialty into a project')
  .option('--force', 'Overwrite if exists')
  .action(async (targetPath: string, specialtyName: string, opts: { force?: boolean }) => {
    const { deploySpecialties } = await import('../src/deployers/specialty-deployer.js');
    const result = await deploySpecialties([specialtyName], { targetPath, force: opts.force });
    if (result.deployed.length > 0) {
      console.log(`Deployed specialty: ${result.deployed.join(', ')}`);
    }
    if (result.skipped.length > 0) {
      console.log(`Skipped (already exists): ${result.skipped.join(', ')}`);
    }
    for (const w of result.warnings) {
      console.log(`Warning: ${w}`);
    }
  });

// ── deploy-agent ─────────────────────────────────────────────────────

program
  .command('deploy-agent <target-path> <agent-name>')
  .description('Deploy a single agent into a project')
  .option('--force', 'Overwrite if exists')
  .action(async (targetPath: string, agentName: string, opts: { force?: boolean }) => {
    const { deployAgents } = await import('../src/deployers/agent-deployer.js');
    const result = await deployAgents([agentName], { targetPath, force: opts.force });
    if (result.deployed.length > 0) {
      console.log(`Deployed agent: ${result.deployed.join(', ')}`);
    }
    if (result.skipped.length > 0) {
      console.log(`Skipped (already exists): ${result.skipped.join(', ')}`);
    }
    for (const w of result.warnings) {
      console.log(`Warning: ${w}`);
    }
  });

// ── deploy-mcp ───────────────────────────────────────────────────────

program
  .command('deploy-mcp <target-path> <mcp-name>')
  .description('Deploy an MCP server (with shared infrastructure) into a project')
  .action(async (targetPath: string, mcpName: string) => {
    const { deployMcpInfra } = await import('../src/deployers/mcp-deployer.js');
    const infraResult = await deployMcpInfra(targetPath);
    if (infraResult.deployed) {
      console.log('Deployed MCP infrastructure (.mcp-infra/)');
    } else if (infraResult.updated) {
      console.log('Updated MCP infrastructure to latest version');
    } else {
      console.log('MCP infrastructure already up to date');
    }
    // MCP server deployment will be implemented in Phase 4 (MCP Creator)
    console.log(`MCP server "${mcpName}" deployment: coming in Phase 4`);
  });

// ── create-agent ────────────────────────────────────────────────────

program
  .command('create-agent')
  .description('Launch the Agent Creation Wizard')
  .action(async () => {
    const { runAgentWizardCli } = await import('../src/wizards/agent-wizard.js');
    await runAgentWizardCli();
  });

// ── create-specialty ────────────────────────────────────────────────

program
  .command('create-specialty')
  .description('Launch the Specialty Creation Wizard')
  .action(async () => {
    const { runSpecialtyWizardCli } = await import('../src/wizards/specialty-wizard.js');
    await runSpecialtyWizardCli();
  });

// ── create-mcp ──────────────────────────────────────────────────────

program
  .command('create-mcp')
  .description('Launch the MCP Server Creation Wizard (intelligent API research)')
  .action(async () => {
    const { runMcpWizardCli } = await import('../src/wizards/mcp-wizard.js');
    await runMcpWizardCli();
  });

// ── create-feature ──────────────────────────────────────────────────

program
  .command('create-feature')
  .description('Launch the Feature Spec Creation Wizard (spec.md + plan.md)')
  .action(async () => {
    const { runFeatureWizardCli } = await import('../src/wizards/feature-wizard.js');
    await runFeatureWizardCli();
  });

// ── create-team ────────────────────────────────────────────────────

program
  .command('create-team')
  .description('Launch the Workforce Team Creation Wizard')
  .action(async () => {
    const { runTeamWizardCli } = await import('../src/wizards/team-wizard.js');
    await runTeamWizardCli();
  });

// ── login ────────────────────────────────────────────────────────────

program
  .command('login')
  .description('Authenticate with a license key')
  .option('--key <key>', 'License key (or enter interactively)')
  .action(async (opts: { key?: string }) => {
    const { executeLogin } = await import('../src/commands/login.js');
    await executeLogin(opts.key);
  });

// ── logout ───────────────────────────────────────────────────────────

program
  .command('logout')
  .description('Remove stored license credentials')
  .action(async () => {
    const { executeLogout } = await import('../src/commands/logout.js');
    await executeLogout();
  });

// ── license ──────────────────────────────────────────────────────────

const licenseCmd = program
  .command('license')
  .description('License management commands');

licenseCmd
  .command('status')
  .description('Show current license status, tier, and entitled assets')
  .action(async () => {
    const { executeLicenseStatus } = await import('../src/commands/license-status.js');
    await executeLicenseStatus();
  });

// ── dashboard ────────────────────────────────────────────────────────

program
  .command('dashboard')
  .description('Launch the web dashboard')
  .option('--port <port>', 'Port number', '3847')
  .action(async (opts: { port: string }) => {
    const { startDashboard } = await import('../src/commands/dashboard.js');
    await startDashboard(parseInt(opts.port, 10));
  });

program.parse();
