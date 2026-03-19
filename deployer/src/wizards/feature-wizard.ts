/**
 * Feature Spec Creation Wizard - walks through creating a new feature
 * specification (spec.md + plan.md) that can be deployed into any project.
 * The target project then runs the full SpecKit workflow (clarify, tasks,
 * analyze, implement) locally.
 */

import chalk from 'chalk';
import path from 'path';
import { ensureDir, writeText, exists, getProjectRoot, readText } from '../utils/file-ops.js';
import { ask, confirm, askList, select, multiLine, closePrompt } from './prompt-engine.js';

/** Feature wizard input (shared between CLI and API) */
export interface FeatureWizardInput {
  name: string;
  featureNumber: number;
  branchName: string;
  description: string;
  userStories: {
    title: string;
    priority: string;
    description: string;
    acceptanceCriteria: string[];
  }[];
  functionalRequirements: string[];
  edgeCases: string[];
  successCriteria: string[];
  openQuestions: string[];
  technicalApproach?: string;
  constitutionProfile?: string;
}

/**
 * Runs the interactive CLI feature wizard.
 */
export async function runFeatureWizardCli(): Promise<void> {
  console.log(chalk.bold('\n  TheLibrary - Feature Spec Creation Wizard\n'));
  console.log(chalk.dim('  Creates spec.md + plan.md ready for deployment into any project.'));
  console.log(chalk.dim('  The target project runs SpecKit workflow (clarify -> tasks -> implement).\n'));

  const name = await ask('  Feature name (e.g. "User Authentication")');
  const featureNumber = parseInt(await ask('  Feature number', '1'), 10) || 1;
  const branchName = `${featureNumber}-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  console.log(chalk.dim(`  Branch: ${branchName}`));

  const description = await ask('  Feature description (1-2 sentences)');

  // User Stories
  console.log(chalk.blue('\n  User Stories:'));
  const userStories: FeatureWizardInput['userStories'] = [];
  let addMoreStories = true;

  while (addMoreStories) {
    console.log(chalk.dim(`\n  User Story ${userStories.length + 1}:`));
    const title = await ask('    Title');
    const priority = await select('    Priority:', ['P1 - Must have (MVP)', 'P2 - Should have', 'P3 - Nice to have']);
    const storyDesc = await ask('    Description (As a user, I want...)');
    const acceptanceCriteria = await askList('    Acceptance criteria (Given/When/Then)', [
      'Given [precondition], When [action], Then [expected result]',
    ]);

    userStories.push({
      title,
      priority: priority.split(' ')[0],
      description: storyDesc,
      acceptanceCriteria,
    });

    addMoreStories = await confirm('  Add another user story?', userStories.length < 3);
  }

  // Requirements
  console.log(chalk.blue('\n  Requirements:'));
  const functionalRequirements = await askList('  Functional requirements', [
    'The system must...',
  ]);

  const edgeCases = await askList('  Edge cases to handle', [
    'What happens when...',
  ]);

  const successCriteria = await askList('  Success criteria (measurable)', [
    'All acceptance tests pass',
    'No regressions in existing functionality',
  ]);

  const openQuestions = await askList('  Open questions / needs clarification', []);

  // Optional: technical approach
  const addApproach = await confirm('  Add technical approach notes?', false);
  let technicalApproach: string | undefined;
  if (addApproach) {
    technicalApproach = await ask('  Technical approach summary');
  }

  const input: FeatureWizardInput = {
    name,
    featureNumber,
    branchName,
    description,
    userStories,
    functionalRequirements,
    edgeCases,
    successCriteria,
    openQuestions,
    technicalApproach,
  };

  console.log(chalk.blue('\n  Generating feature spec files...'));
  const outputDir = await generateFeatureSpec(input);
  console.log(chalk.green(`\n  Feature spec created at ${outputDir}/`));
  console.log(chalk.dim('  Files: spec.md, plan.md'));
  console.log(chalk.dim('\n  To deploy: speckit deploy-feature /path/to/project ' + branchName));
  console.log(chalk.dim('  Then in the target project, run the SpecKit workflow:\n'));
  console.log(chalk.dim('    /speckit.clarify'));
  console.log(chalk.dim('    /speckit.plan'));
  console.log(chalk.dim('    /speckit.tasks'));
  console.log(chalk.dim('    /speckit.implement\n'));

  closePrompt();
}

/**
 * Generates feature spec files from wizard input (used by both CLI and API).
 */
export async function generateFeatureSpec(input: FeatureWizardInput): Promise<string> {
  const featureDir = path.join(getProjectRoot(), 'Features', input.branchName);
  await ensureDir(featureDir);

  // Generate spec.md
  const specMd = generateSpecMd(input);
  await writeText(path.join(featureDir, 'spec.md'), specMd);

  // Generate plan.md stub
  const planMd = generatePlanMd(input);
  await writeText(path.join(featureDir, 'plan.md'), planMd);

  return featureDir;
}

function generateSpecMd(input: FeatureWizardInput): string {
  const sections: string[] = [];

  sections.push(`# Feature Specification: ${input.name}\n`);
  sections.push(`**Feature Branch**: \`${input.branchName}\``);
  sections.push(`**Created**: ${new Date().toISOString().split('T')[0]}`);
  sections.push(`**Status**: Draft`);
  sections.push(`**Input**: ${input.description}\n`);

  sections.push(`---\n`);

  // User Stories
  sections.push(`## User Scenarios & Testing\n`);
  input.userStories.forEach((story, i) => {
    sections.push(`### User Story ${i + 1} - ${story.title} (Priority: ${story.priority})\n`);
    sections.push(`${story.description}\n`);
    sections.push(`**Independent Test**: This story can be tested independently.\n`);
    sections.push(`**Acceptance Scenarios**:\n`);
    story.acceptanceCriteria.forEach((ac) => {
      sections.push(`- ${ac}`);
    });
    sections.push('');
  });

  // Edge Cases
  if (input.edgeCases.length > 0) {
    sections.push(`### Edge Cases\n`);
    input.edgeCases.forEach((ec) => sections.push(`- ${ec}`));
    sections.push('');
  }

  sections.push(`---\n`);

  // Requirements
  sections.push(`## Requirements\n`);
  sections.push(`### Functional Requirements\n`);
  input.functionalRequirements.forEach((req, i) => {
    sections.push(`- **FR-${String(i + 1).padStart(3, '0')}**: ${req}`);
  });
  sections.push('');

  sections.push(`---\n`);

  // Success Criteria
  sections.push(`## Success Criteria\n`);
  input.successCriteria.forEach((sc, i) => {
    sections.push(`- **SC-${String(i + 1).padStart(3, '0')}**: ${sc}`);
  });
  sections.push('');

  // Open Questions
  if (input.openQuestions.length > 0) {
    sections.push(`---\n`);
    sections.push(`## Open Questions / NEEDS CLARIFICATION\n`);
    input.openQuestions.forEach((q) => sections.push(`- [ ] ${q}`));
  }

  return sections.join('\n');
}

function generatePlanMd(input: FeatureWizardInput): string {
  const sections: string[] = [];

  sections.push(`# Implementation Plan: ${input.name}\n`);
  sections.push(`**Feature Branch**: \`${input.branchName}\``);
  sections.push(`**Created**: ${new Date().toISOString().split('T')[0]}`);
  sections.push(`**Status**: Pending (run /speckit.plan in target project)\n`);

  sections.push(`---\n`);

  sections.push(`## Summary\n`);
  sections.push(`${input.description}\n`);

  if (input.technicalApproach) {
    sections.push(`### Technical Approach\n`);
    sections.push(`${input.technicalApproach}\n`);
  }

  sections.push(`---\n`);

  sections.push(`## Constitution Check\n`);
  sections.push(`> This gate table will be populated when deployed into a target project.`);
  sections.push(`> Run \`/speckit.plan\` in the target project to generate the full plan.\n`);
  sections.push(`| Principle | Status | Notes |`);
  sections.push(`|-----------|--------|-------|`);
  sections.push(`| [Auto-populated on deploy] | - | - |\n`);

  sections.push(`---\n`);

  sections.push(`## Implementation Phases\n`);
  sections.push(`> Phases will be generated by SpecKit when deployed into the target project.\n`);
  sections.push(`### Phase 1: Setup`);
  sections.push(`- [ ] To be defined\n`);
  sections.push(`### Phase 2: Core Implementation`);
  sections.push(`- [ ] To be defined\n`);
  sections.push(`### Phase 3: Testing & Polish`);
  sections.push(`- [ ] To be defined\n`);

  return sections.join('\n');
}
