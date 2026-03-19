/**
 * Agent Creation Wizard - walks through creating a new agent definition
 * with role, responsibilities, operating principles, skills, and tone.
 * Generates Agents.md + manifest.json in the library.
 */

import chalk from 'chalk';
import path from 'path';
import { ensureDir, writeText, writeJson, exists, getProjectRoot } from '../utils/file-ops.js';
import { ask, confirm, askList, multiLine, select, closePrompt } from './prompt-engine.js';
import { getAllSkills } from '../registry/asset-registry.js';

/** Agent wizard input (shared between CLI and API) */
export interface AgentWizardInput {
  name: string;
  displayName: string;
  purpose: string;
  responsibilities: string[];
  operatingPrinciples: string[];
  preferredOutputFormats: string[];
  tone: string;
  requiredSkills: string[];
  tags: string[];
  personalizationFields?: string[];
  standingInstructions?: string[];
}

/**
 * Runs the interactive CLI agent wizard.
 */
export async function runAgentWizardCli(): Promise<void> {
  console.log(chalk.bold('\n  TheLibrary - Agent Creation Wizard\n'));

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

  const tone = await ask(
    '  Tone/style (e.g. "calm, polished, discreet, efficient")',
    'calm, polished, discreet, efficient'
  );

  const preferredOutputFormats = await askList('  Preferred output formats', [
    'Daily brief',
    'Decision memo',
    'Meeting brief',
    'Weekly review',
  ]);

  // Skill selection
  const availableSkills = await getAllSkills();
  const skillNames = availableSkills.map((s) => s.displayName);
  console.log(chalk.dim('\n  Select required skills from the library:'));
  skillNames.forEach((s, i) => console.log(chalk.dim(`    ${i + 1}. ${s}`)));
  const selectedSkillsRaw = await ask('  Skill numbers (comma-separated, or blank for none)');
  const requiredSkills = selectedSkillsRaw
    ? selectedSkillsRaw
        .split(',')
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((i) => i >= 0 && i < availableSkills.length)
        .map((i) => availableSkills[i].name)
    : [];

  const tags = await askList('  Tags for categorization', ['executive', 'productivity']);

  const addPersonalization = await confirm('  Add personalization fields?', true);
  let personalizationFields: string[] = [];
  if (addPersonalization) {
    personalizationFields = await askList('  Personalization fields', [
      'Principal name',
      'Role/title',
      'Company',
      'Primary goals',
      'Communication style',
      'Working hours / timezone',
    ]);
  }

  const addInstructions = await confirm('  Add standing instructions?', false);
  let standingInstructions: string[] = [];
  if (addInstructions) {
    standingInstructions = await askList('  Standing instructions');
  }

  const input: AgentWizardInput = {
    name,
    displayName,
    purpose,
    responsibilities,
    operatingPrinciples,
    preferredOutputFormats,
    tone,
    requiredSkills,
    tags,
    personalizationFields,
    standingInstructions,
  };

  console.log(chalk.blue('\n  Generating agent files...'));
  await generateAgent(input);
  console.log(chalk.green(`\n  Agent "${displayName}" created at Agents/${name}/`));
  console.log(chalk.dim(`  Files: Agents.md, manifest.json, Context/\n`));

  closePrompt();
}

/**
 * Generates agent files from wizard input (used by both CLI and API).
 */
export async function generateAgent(input: AgentWizardInput): Promise<string> {
  const agentDir = path.join(getProjectRoot(), 'Agents', input.name);
  await ensureDir(path.join(agentDir, 'Context'));

  // Generate Agents.md
  const agentsMd = generateAgentsMd(input);
  await writeText(path.join(agentDir, 'Agents.md'), agentsMd);

  // Generate CLAUDE.md (same as Agents.md for now)
  await writeText(path.join(agentDir, 'CLAUDE.md'), agentsMd);

  // Generate empty MEMORY.md
  await writeText(path.join(agentDir, 'MEMORY.md'), '');

  // Generate manifest.json
  const manifest = {
    name: input.name,
    displayName: input.displayName,
    version: '1.0.0',
    description: input.purpose,
    files: {
      agents: 'Agents.md',
      claude: 'CLAUDE.md',
      memory: 'MEMORY.md',
    },
    requiredSkills: input.requiredSkills,
    requiredMcp: [],
    tags: input.tags,
  };
  await writeJson(path.join(agentDir, 'manifest.json'), manifest);

  return agentDir;
}

function generateAgentsMd(input: AgentWizardInput): string {
  const sections: string[] = [];

  sections.push(`# ${input.displayName} Agent\n`);

  sections.push(`## Purpose\n`);
  sections.push(`${input.purpose}\n`);

  sections.push(`---\n`);

  sections.push(`## Core Responsibilities\n`);
  input.responsibilities.forEach((r, i) => {
    sections.push(`${i + 1}. ${r}`);
  });

  sections.push(`\n---\n`);

  sections.push(`## Operating Principles\n`);
  input.operatingPrinciples.forEach((p, i) => {
    sections.push(`${i + 1}. **${p}**`);
  });

  sections.push(`\n---\n`);

  sections.push(`## Tone and Style\n`);
  sections.push(`Your tone should be: ${input.tone}\n`);
  sections.push(`Your writing should feel like an exceptional professional: clear, composed, practical, and thoughtful.`);
  sections.push(`Avoid sounding robotic, overly enthusiastic, or verbose.\n`);

  sections.push(`---\n`);

  if (input.preferredOutputFormats.length > 0) {
    sections.push(`## Preferred Output Formats\n`);
    input.preferredOutputFormats.forEach((f) => {
      sections.push(`### ${f}`);
      sections.push(`- [Define structure for this format]\n`);
    });
    sections.push(`---\n`);
  }

  sections.push(`## How to Work\n`);
  sections.push(`### Default Workflow\n`);
  sections.push(`For most requests, follow this pattern:`);
  sections.push(`1. Clarify the objective`);
  sections.push(`2. Identify the deadline, stakeholders, and desired outcome`);
  sections.push(`3. Determine what is urgent vs. important`);
  sections.push(`4. Produce a practical output`);
  sections.push(`5. Suggest the next 1-3 actions`);
  sections.push(`6. Flag any risks, blockers, or missing information\n`);

  sections.push(`---\n`);

  sections.push(`## Rules of Engagement\n`);
  sections.push(`1. Do not invent facts, dates, commitments, names, or decisions`);
  sections.push(`2. Ask for missing critical details only when necessary`);
  sections.push(`3. Otherwise, make sensible assumptions and clearly label them`);
  sections.push(`4. If multiple tasks are mixed together, separate them into a clear action plan`);
  sections.push(`5. Always end with a clear proposed next step when appropriate`);
  sections.push(`6. Default to executive-ready formatting\n`);

  if (input.personalizationFields && input.personalizationFields.length > 0) {
    sections.push(`---\n`);
    sections.push(`## Personalization Fields\n`);
    sections.push(`Replace the placeholders below to customize this agent:\n`);
    input.personalizationFields.forEach((f) => {
      sections.push(`- ${f}: [Your value]`);
    });
  }

  if (input.standingInstructions && input.standingInstructions.length > 0) {
    sections.push(`\n---\n`);
    sections.push(`## Standing Instructions\n`);
    input.standingInstructions.forEach((i) => {
      sections.push(`- ${i}`);
    });
  }

  sections.push(`\n---\n`);
  sections.push(`## Final Standard\n`);
  sections.push(`At all times, act as a trusted operator who makes the principal more focused, more prepared, and harder to overwhelm.`);
  sections.push(`Your job is not merely to respond. Your job is to create clarity, preserve momentum, and help the principal operate at a high level.`);

  return sections.join('\n');
}
