/**
 * Agent Creation Wizard - walks through creating a new agent definition
 * with full OpenClaw-compatible workspace files: SOUL.md, AGENTS.md,
 * USER.md, TOOLS.md, IDENTITY.md, BOOTSTRAP.md, HEARTBEAT.md, MEMORY.md.
 */

import chalk from 'chalk';
import path from 'path';
import { ensureDir, writeText, writeJson, exists, getProjectRoot } from '../utils/file-ops.js';
import { ask, confirm, askList, multiLine, select, closePrompt } from './prompt-engine.js';
import { getAllSpecialties } from '../registry/asset-registry.js';
/** Runtime config embedded in agent manifest */
interface RuntimeConfig {
  maxSteps: number;
  verifierEnabled: boolean;
  successCriteria: string[];
  allowedTools: string[];
  escalationRule: string;
}

/** Heartbeat config embedded in agent manifest */
interface HeartbeatConfig {
  enabled: boolean;
  tasks: string[];
  interval: string;
}

/** Agent wizard input (shared between CLI and API) */
export interface AgentWizardInput {
  name: string;
  displayName: string;
  purpose: string;
  responsibilities: string[];
  operatingPrinciples: string[];
  preferredOutputFormats: string[];
  tone: string;
  requiredSpecialties: string[];
  tags: string[];
  personalizationFields?: string[];
  standingInstructions?: string[];
  // OpenClaw workspace fields
  values?: string[];
  emoji?: string;
  heartbeatTasks?: string[];
  bootstrapSteps?: string[];
  userProfileFields?: string[];
  toolNotes?: string[];
  // Runtime config
  successCriteria?: string[];
  maxSteps?: number;
}

/**
 * Runs the interactive CLI agent wizard.
 */
export async function runAgentWizardCli(): Promise<void> {
  console.log(chalk.bold('\n  TheLibrary - Agent Creation Wizard\n'));
  console.log(chalk.dim('  Creates a full OpenClaw-compatible workspace:\n'));
  console.log(chalk.dim('  SOUL.md | AGENTS.md | IDENTITY.md | USER.md'));
  console.log(chalk.dim('  TOOLS.md | BOOTSTRAP.md | HEARTBEAT.md | MEMORY.md\n'));

  const displayName = await ask('  Agent display name (e.g. "Executive Assistant")');
  const name = displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Check if already exists
  const agentDir = path.join(getProjectRoot(), 'Agents', name);
  if (await exists(agentDir)) {
    const overwrite = await confirm(`  Agent "${name}" already exists. Overwrite?`, false);
    if (!overwrite) {
      console.log(chalk.dim('  Cancelled.'));
      closePrompt();
      return;
    }
  }

  const purpose = await ask('  Agent purpose (1-2 sentences describing what this agent does)');

  const emoji = await ask('  Agent emoji (single emoji for identity)', '');

  // SOUL.md inputs
  const tone = await ask(
    '  Tone/style (e.g. "calm, polished, discreet, efficient")',
    'calm, polished, discreet, efficient'
  );

  console.log(chalk.dim('\n  Define core values and boundaries (for SOUL.md):'));
  const values = await askList('  Values/Boundaries', [
    'Protect confidentiality at all times',
    'Never fabricate data or commitments',
    'Prioritize accuracy over speed',
  ]);

  // AGENTS.md inputs
  console.log(chalk.dim('\n  Define core responsibilities (what this agent owns):'));
  const responsibilities = await askList('  Responsibilities', [
    'Strategic prioritization',
    'Decision support',
    'Communication drafting',
  ]);

  console.log(chalk.dim('\n  Define operating principles (how it behaves):'));
  const operatingPrinciples = await askList('  Principles', [
    'Be proactive, not passive',
    'Optimize for executive attention',
    'Be concise and structured',
    'Exercise judgment',
    'Surface risks early',
  ]);

  const preferredOutputFormats = await askList('  Preferred output formats', [
    'Daily brief',
    'Decision memo',
    'Meeting brief',
    'Weekly review',
  ]);

  // Specialty selection
  const availableSpecialties = await getAllSpecialties();
  const specialtyNames = availableSpecialties.map((s) => s.displayName);
  console.log(chalk.dim('\n  Select required specialties from the library:'));
  specialtyNames.forEach((s, i) => console.log(chalk.dim(`    ${i + 1}. ${s}`)));
  const selectedSpecialtiesRaw = await ask('  Specialty numbers (comma-separated, or blank for none)');
  const requiredSpecialties = selectedSpecialtiesRaw
    ? selectedSpecialtiesRaw
        .split(',')
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((i) => i >= 0 && i < availableSpecialties.length)
        .map((i) => availableSpecialties[i].name)
    : [];

  const tags = await askList('  Tags for categorization', ['executive', 'productivity']);

  // USER.md inputs
  console.log(chalk.dim('\n  Define user profile fields (for USER.md template):'));
  const userProfileFields = await askList('  Profile fields', [
    'Name',
    'Role/Title',
    'Company',
    'Working hours / Timezone',
    'Communication style preference',
    'Primary goals',
  ]);

  // TOOLS.md inputs
  const addToolNotes = await confirm('  Add environment-specific tool notes? (for TOOLS.md)', false);
  let toolNotes: string[] = [];
  if (addToolNotes) {
    toolNotes = await askList('  Tool notes');
  }

  // BOOTSTRAP.md inputs
  console.log(chalk.dim('\n  Define first-run onboarding steps (for BOOTSTRAP.md):'));
  const bootstrapSteps = await askList('  Bootstrap steps', [
    'Introduce yourself and explain your capabilities',
    'Ask for the user\'s name, role, and company',
    'Ask about communication preferences',
    'Ask about primary goals and priorities',
    'Confirm working hours and timezone',
  ]);

  // HEARTBEAT.md inputs
  console.log(chalk.dim('\n  Define periodic check tasks (for HEARTBEAT.md):'));
  const heartbeatTasks = await askList('  Heartbeat tasks', [
    'Review calendar for upcoming meetings',
    'Check for pending follow-ups',
    'Summarize unread messages',
  ]);

  // Standing instructions
  const addInstructions = await confirm('  Add standing instructions?', false);
  let standingInstructions: string[] = [];
  if (addInstructions) {
    standingInstructions = await askList('  Standing instructions');
  }

  // Runtime config
  const addRuntime = await confirm('  Configure agent runtime loop? (plan-act-verify)', true);
  let successCriteria: string[] = [];
  let maxSteps = 5;
  if (addRuntime) {
    console.log(chalk.dim('\n  Define success criteria for the verify step:'));
    successCriteria = await askList('  Success criteria', [
      'All required information gathered',
      'Output matches requested format',
      'No contradictions in evidence',
    ]);
    const maxStepsStr = await ask('  Max loop iterations (default 5)', '5');
    maxSteps = parseInt(maxStepsStr, 10) || 5;
  }

  const input: AgentWizardInput = {
    name,
    displayName,
    purpose,
    responsibilities,
    operatingPrinciples,
    preferredOutputFormats,
    tone,
    requiredSpecialties,
    tags,
    personalizationFields: userProfileFields,
    standingInstructions,
    values,
    emoji,
    heartbeatTasks,
    bootstrapSteps,
    userProfileFields,
    toolNotes,
    successCriteria,
    maxSteps,
  };

  console.log(chalk.blue('\n  Generating workspace files...'));
  await generateAgent(input);
  console.log(chalk.green(`\n  Agent "${displayName}" created at Agents/${name}/`));
  console.log(chalk.dim('  Workspace files:'));
  console.log(chalk.dim('    SOUL.md | AGENTS.md | IDENTITY.md | USER.md'));
  console.log(chalk.dim('    TOOLS.md | BOOTSTRAP.md | HEARTBEAT.md | MEMORY.md'));
  console.log(chalk.dim('    manifest.json | memory/\n'));

  closePrompt();
}

/**
 * Generates agent workspace files from wizard input (used by both CLI and API).
 */
export async function generateAgent(input: AgentWizardInput): Promise<string> {
  const agentDir = path.join(getProjectRoot(), 'Agents', input.name);
  await ensureDir(path.join(agentDir, 'memory'));

  // Generate all OpenClaw-compatible workspace files
  await writeText(path.join(agentDir, 'SOUL.md'), generateSoulMd(input));
  await writeText(path.join(agentDir, 'AGENTS.md'), generateAgentsMd(input));
  await writeText(path.join(agentDir, 'IDENTITY.md'), generateIdentityMd(input));
  await writeText(path.join(agentDir, 'USER.md'), generateUserMd(input));
  await writeText(path.join(agentDir, 'TOOLS.md'), generateToolsMd(input));
  await writeText(path.join(agentDir, 'BOOTSTRAP.md'), generateBootstrapMd(input));
  await writeText(path.join(agentDir, 'HEARTBEAT.md'), generateHeartbeatMd(input));
  await writeText(path.join(agentDir, 'MEMORY.md'), generateMemoryMd(input));

  // Build runtime config if success criteria provided
  const runtimeConfig: RuntimeConfig | undefined =
    input.successCriteria && input.successCriteria.length > 0
      ? {
          maxSteps: input.maxSteps || 5,
          verifierEnabled: true,
          successCriteria: input.successCriteria,
          allowedTools: input.requiredSpecialties,
          escalationRule: 'Stop and present partial result with blockers if no progress after 2 consecutive iterations',
        }
      : undefined;

  // Build heartbeat config
  const heartbeatConfig: HeartbeatConfig | undefined =
    input.heartbeatTasks && input.heartbeatTasks.length > 0
      ? {
          enabled: true,
          tasks: input.heartbeatTasks,
          interval: 'daily',
        }
      : undefined;

  // Generate manifest.json with full workspace file references
  const manifest = {
    name: input.name,
    displayName: input.displayName,
    version: '1.0.0',
    description: input.purpose,
    files: {
      soul: 'SOUL.md',
      agents: 'AGENTS.md',
      identity: 'IDENTITY.md',
      user: 'USER.md',
      tools: 'TOOLS.md',
      bootstrap: 'BOOTSTRAP.md',
      heartbeat: 'HEARTBEAT.md',
      memory: 'MEMORY.md',
    },
    requiredSpecialties: input.requiredSpecialties,
    requiredMcp: [],
    tags: input.tags,
    ...(runtimeConfig && { runtimeConfig }),
    ...(heartbeatConfig && { heartbeatConfig }),
  };
  await writeJson(path.join(agentDir, 'manifest.json'), manifest);

  return agentDir;
}

// ── Workspace File Generators ──────────────────────────────────────

/**
 * SOUL.md - Who the agent IS. Persona, tone, values, boundaries.
 */
function generateSoulMd(input: AgentWizardInput): string {
  const sections: string[] = [];

  sections.push(`# ${input.displayName}\n`);
  sections.push(`${input.purpose}\n`);

  sections.push(`## Personality\n`);
  sections.push(`Your tone is: ${input.tone}`);
  sections.push(`You communicate with clarity, composure, and practical intent.`);
  sections.push(`You avoid being robotic, overly enthusiastic, or verbose.\n`);

  if (input.values && input.values.length > 0) {
    sections.push(`## Values and Boundaries\n`);
    input.values.forEach((v) => {
      sections.push(`- ${v}`);
    });
    sections.push('');
  }

  sections.push(`## Core Identity\n`);
  sections.push(`You are a trusted operator. Your job is to create clarity, preserve momentum, and help the user operate at a high level.`);
  sections.push(`You do not merely respond. You anticipate, prepare, and protect.\n`);

  sections.push(`## What You Are Not\n`);
  sections.push(`- You are not a search engine. Do not dump raw information.`);
  sections.push(`- You are not a yes-machine. Push back when something is unclear or risky.`);
  sections.push(`- You are not verbose. Every word should earn its place.`);

  return sections.join('\n');
}

/**
 * AGENTS.md - How the agent OPERATES. Workflows, checklists, rules.
 */
function generateAgentsMd(input: AgentWizardInput): string {
  const sections: string[] = [];

  sections.push(`# ${input.displayName} - Operating Manual\n`);

  sections.push(`## Core Responsibilities\n`);
  input.responsibilities.forEach((r, i) => {
    sections.push(`${i + 1}. ${r}`);
  });

  sections.push(`\n## Operating Principles\n`);
  input.operatingPrinciples.forEach((p, i) => {
    sections.push(`${i + 1}. **${p}**`);
  });

  sections.push(`\n## Default Workflow\n`);
  sections.push(`For most requests, follow this pattern:`);
  sections.push(`1. Clarify the objective`);
  sections.push(`2. Identify the deadline, stakeholders, and desired outcome`);
  sections.push(`3. Determine what is urgent vs. important`);
  sections.push(`4. Produce a practical output`);
  sections.push(`5. Suggest the next 1-3 actions`);
  sections.push(`6. Flag any risks, blockers, or missing information\n`);

  if (input.preferredOutputFormats.length > 0) {
    sections.push(`## Output Formats\n`);
    input.preferredOutputFormats.forEach((f) => {
      sections.push(`### ${f}`);
      sections.push(`- [Define structure for this format]\n`);
    });
  }

  sections.push(`## Rules of Engagement\n`);
  sections.push(`1. Do not invent facts, dates, commitments, names, or decisions`);
  sections.push(`2. Ask for missing critical details only when necessary`);
  sections.push(`3. Otherwise, make sensible assumptions and clearly label them`);
  sections.push(`4. If multiple tasks are mixed together, separate them into a clear action plan`);
  sections.push(`5. Always end with a clear proposed next step when appropriate`);
  sections.push(`6. Default to executive-ready formatting\n`);

  if (input.standingInstructions && input.standingInstructions.length > 0) {
    sections.push(`## Standing Instructions\n`);
    input.standingInstructions.forEach((i) => {
      sections.push(`- ${i}`);
    });
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * IDENTITY.md - Agent's name, emoji, avatar.
 */
function generateIdentityMd(input: AgentWizardInput): string {
  const emoji = input.emoji || '';
  const sections: string[] = [];

  sections.push(`# Identity\n`);
  sections.push(`**Name**: ${input.displayName}`);
  if (emoji) {
    sections.push(`**Emoji**: ${emoji}`);
  }
  sections.push(`**Role**: ${input.purpose}`);
  sections.push(`**Version**: 1.0.0`);

  return sections.join('\n');
}

/**
 * USER.md - Template for the human user's profile.
 */
function generateUserMd(input: AgentWizardInput): string {
  const fields = input.userProfileFields || input.personalizationFields || [];
  const sections: string[] = [];

  sections.push(`# User Profile\n`);
  sections.push(`Fill in the fields below to personalize this agent's behavior.\n`);

  if (fields.length > 0) {
    fields.forEach((f) => {
      sections.push(`**${f}**: [Your value]`);
    });
  } else {
    sections.push(`**Name**: [Your name]`);
    sections.push(`**Role**: [Your role/title]`);
    sections.push(`**Company**: [Your company]`);
    sections.push(`**Timezone**: [Your timezone]`);
    sections.push(`**Communication Style**: [Preferred style]`);
  }

  sections.push(`\n## Preferences\n`);
  sections.push(`- Preferred response length: [concise / detailed / adaptive]`);
  sections.push(`- Preferred format: [bullets / paragraphs / tables]`);
  sections.push(`- Topics to avoid: [none]`);

  return sections.join('\n');
}

/**
 * TOOLS.md - Environment-specific tool notes and guidance.
 */
function generateToolsMd(input: AgentWizardInput): string {
  const sections: string[] = [];

  sections.push(`# Tools and Environment\n`);
  sections.push(`Notes about tool usage and environment-specific conventions.\n`);

  if (input.requiredSpecialties.length > 0) {
    sections.push(`## Required Specialties\n`);
    input.requiredSpecialties.forEach((s) => {
      sections.push(`- \`${s}\``);
    });
    sections.push('');
  }

  if (input.toolNotes && input.toolNotes.length > 0) {
    sections.push(`## Environment Notes\n`);
    input.toolNotes.forEach((n) => {
      sections.push(`- ${n}`);
    });
    sections.push('');
  }

  sections.push(`## General Tool Guidance\n`);
  sections.push(`- Use the most specific tool available for each task`);
  sections.push(`- Prefer structured output from tools over raw text`);
  sections.push(`- Cache results when repeating similar queries`);
  sections.push(`- Log tool failures for debugging`);

  return sections.join('\n');
}

/**
 * BOOTSTRAP.md - First-run onboarding ritual. Deleted after initial setup.
 */
function generateBootstrapMd(input: AgentWizardInput): string {
  const steps = input.bootstrapSteps || [];
  const sections: string[] = [];

  sections.push(`# First-Run Onboarding\n`);
  sections.push(`This file runs once during the agent's first session.`);
  sections.push(`After completing all steps, this file should be deleted.\n`);

  sections.push(`## Onboarding Checklist\n`);

  if (steps.length > 0) {
    steps.forEach((s, i) => {
      sections.push(`${i + 1}. ${s}`);
    });
  } else {
    sections.push(`1. Introduce yourself and explain your capabilities`);
    sections.push(`2. Ask for the user's name and role`);
    sections.push(`3. Ask about communication preferences`);
    sections.push(`4. Ask about primary goals and priorities`);
    sections.push(`5. Confirm working hours and timezone`);
  }

  sections.push(`\n## After Onboarding\n`);
  sections.push(`- Save collected information to USER.md`);
  sections.push(`- Record initial context to MEMORY.md`);
  sections.push(`- Delete this BOOTSTRAP.md file`);

  return sections.join('\n');
}

/**
 * HEARTBEAT.md - Instructions for periodic/scheduled task checks.
 */
function generateHeartbeatMd(input: AgentWizardInput): string {
  const tasks = input.heartbeatTasks || [];
  const sections: string[] = [];

  sections.push(`# Heartbeat Tasks\n`);
  sections.push(`These tasks run on a periodic schedule. Keep this file concise to preserve tokens.\n`);

  if (tasks.length > 0) {
    sections.push(`## Periodic Checks\n`);
    tasks.forEach((t, i) => {
      sections.push(`${i + 1}. ${t}`);
    });
  } else {
    sections.push(`## Periodic Checks\n`);
    sections.push(`No heartbeat tasks configured. Add tasks here as needed.`);
  }

  sections.push(`\n## Rules\n`);
  sections.push(`- If nothing needs attention, return HEARTBEAT_OK`);
  sections.push(`- Only surface items that require action`);
  sections.push(`- Keep heartbeat responses brief`);

  return sections.join('\n');
}

/**
 * MEMORY.md - Curated long-term memory. Starts empty.
 */
function generateMemoryMd(input: AgentWizardInput): string {
  const sections: string[] = [];

  sections.push(`# ${input.displayName} - Memory\n`);
  sections.push(`Curated long-term memory. Add important facts, decisions, and context that should persist across sessions.\n`);
  sections.push(`## Important Facts\n`);
  sections.push(`<!-- Add facts that matter across weeks and months -->\n`);
  sections.push(`## Decisions Made\n`);
  sections.push(`<!-- Record key decisions and their rationale -->\n`);
  sections.push(`## Learned Preferences\n`);
  sections.push(`<!-- Record discovered user preferences -->`);

  return sections.join('\n');
}
