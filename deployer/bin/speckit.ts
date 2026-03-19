#!/usr/bin/env tsx
/**
 * TheLibrary - SpecKit Deployer CLI
 *
 * Uniform deployment of SpecKit, Beads, Agents, Skills, MCP Servers,
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
  .description('TheLibrary - SpecKit Deployer. Uniform deployment of agents, skills, MCP servers, and templates.')
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
  .option('--skills <skills>', 'Comma-separated list of skills to deploy')
  .option('--agents <agents>', 'Comma-separated list of agents to deploy')
  .option('--templates <templates>', 'Comma-separated list of templates to deploy')
  .option('--features <features>', 'Comma-separated list of feature specs to deploy')
  .option('--security', 'Deploy security baseline module')
  .option('--dry-run', 'Preview what would be deployed without making changes')
  .option('--force', 'Force overwrite existing files')
  .option('--scaffold', 'Scaffold a fresh project (equivalent to deploy into empty directory)')
  .action(async (targetPath: string, opts: {
    profile?: string;
    skills?: string;
    agents?: string;
    templates?: string;
    features?: string;
    security?: boolean;
    dryRun?: boolean;
    force?: boolean;
    scaffold?: boolean;
  }) => {
    const options: DeployOptions = {
      targetPath,
      profile: opts.profile as ConstitutionProfile | undefined,
      skills: opts.skills?.split(',').map((s) => s.trim()),
      agents: opts.agents?.split(',').map((s) => s.trim()),
      templates: opts.templates?.split(',').map((s) => s.trim()),
      features: opts.features?.split(',').map((s) => s.trim()),
      security: opts.security,
      dryRun: opts.dryRun,
      force: opts.force,
      scaffold: opts.scaffold,
    };
    await executeDeploy(options);
  });

// ── scaffold ─────────────────────────────────────────────────────────

program
  .command('scaffold <target-path>')
  .description('Scaffold a fresh project with language-appropriate structure and SpecKit')
  .option('--language <language>', 'Project language (typescript, python, go, rust)', 'typescript')
  .option('--profile <profile>', 'Constitution profile')
  .option('--security', 'Include security baseline')
  .action(async (targetPath: string, opts: { language?: string; profile?: string; security?: boolean }) => {
    const { executeScaffold } = await import('../src/commands/scaffold.js');
    await executeScaffold(targetPath, opts);
  });

// ── bundle ───────────────────────────────────────────────────────────

program
  .command('bundle <target-path> <package-name>')
  .description('Deploy an entire workforce package')
  .option('--dry-run', 'Preview without making changes')
  .action(async (targetPath: string, packageName: string, opts: { dryRun?: boolean }) => {
    await executeBundle(targetPath, packageName, opts.dryRun);
  });

// ── list ─────────────────────────────────────────────────────────────

program
  .command('list [type]')
  .description('List available assets (agents, skills, templates, packages, profiles, all)')
  .action(async (type: string = 'all') => {
    await executeList(type as any);
  });

// ── deploy-skill ─────────────────────────────────────────────────────

program
  .command('deploy-skill <target-path> <skill-name>')
  .description('Deploy a single skill into a project')
  .option('--force', 'Overwrite if exists')
  .action(async (targetPath: string, skillName: string, opts: { force?: boolean }) => {
    const { deploySkills } = await import('../src/deployers/skill-deployer.js');
    const result = await deploySkills([skillName], { targetPath, force: opts.force });
    if (result.deployed.length > 0) {
      console.log(`Deployed skill: ${result.deployed.join(', ')}`);
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

// ── create-skill ────────────────────────────────────────────────────

program
  .command('create-skill')
  .description('Launch the Skill Creation Wizard')
  .action(async () => {
    const { runSkillWizardCli } = await import('../src/wizards/skill-wizard.js');
    await runSkillWizardCli();
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

// ── create-package ──────────────────────────────────────────────────

program
  .command('create-package')
  .description('Launch the Workforce Package Creation Wizard')
  .action(async () => {
    const { runPackageWizardCli } = await import('../src/wizards/package-wizard.js');
    await runPackageWizardCli();
  });

// ── generate-docs ───────────────────────────────────────────────────

program
  .command('generate-docs <feature-dir>')
  .description('Generate technical documentation (HTML + Markdown) for a feature')
  .option('--output <dir>', 'Output directory (defaults to current directory)', '.')
  .option('--format <format>', 'Output format: html, md, or both', 'both')
  .action(async (featureDir: string, opts: { output: string; format: string }) => {
    const path = await import('path');
    const resolvedFeatureDir = path.resolve(featureDir);
    const resolvedOutput = path.resolve(opts.output);
    const results: string[] = [];

    if (opts.format === 'md' || opts.format === 'both') {
      const { generateTechnicalDocsMd } = await import('../src/generators/technical-docs-md-generator.js');
      const mdPath = await generateTechnicalDocsMd(resolvedFeatureDir, resolvedOutput);
      results.push(`Markdown: ${mdPath}`);
    }

    if (opts.format === 'html' || opts.format === 'both') {
      const { generateTechnicalDocsHtml } = await import('../src/generators/technical-docs-generator.js');
      const htmlPath = await generateTechnicalDocsHtml(resolvedFeatureDir, resolvedOutput);
      results.push(`HTML: ${htmlPath}`);
    }

    for (const r of results) {
      console.log(`  Generated: ${r}`);
    }
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
