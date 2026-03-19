/**
 * Skill Creation Wizard - walks through creating a new skill definition
 * with name, description, invocation, MCP dependencies, and reference templates.
 * Generates SKILL.md + reference/ in the library.
 */

import chalk from 'chalk';
import path from 'path';
import { ensureDir, writeText, exists, getProjectRoot } from '../utils/file-ops.js';
import { ask, confirm, askList, select, closePrompt } from './prompt-engine.js';

/** Skill wizard input (shared between CLI and API) */
export interface SkillWizardInput {
  name: string;
  displayName: string;
  description: string;
  invocationCommand: string;
  invocationArgs: string;
  outputFormat: string;
  designSystem: boolean;
  mcpDependencies: string[];
  sections: string[];
  steps: string[];
}

/**
 * Runs the interactive CLI skill wizard.
 */
export async function runSkillWizardCli(): Promise<void> {
  console.log(chalk.bold('\n  TheLibrary - Skill Creation Wizard\n'));

  const displayName = await ask('  Skill display name (e.g. "Account Research")');
  const name = displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Check if already exists
  const skillDir = path.join(getProjectRoot(), 'Skills', displayName);
  if (await exists(skillDir)) {
    const overwrite = await confirm(`  Skill "${displayName}" already exists. Overwrite?`, false);
    if (!overwrite) {
      console.log(chalk.dim('  Cancelled.'));
      closePrompt();
      return;
    }
  }

  const description = await ask('  Description (what this skill produces)');

  const invocationCommand = await ask('  Invocation command', `/${name}`);
  const invocationArgs = await ask('  Invocation arguments (e.g. "<company-name> or <topic>")', `<topic>`);

  const outputFormat = await select('  Output format:', [
    'Standalone HTML document (Dev Labs design system)',
    'Markdown document',
    'JSON structured output',
    'Plain text',
  ]);

  const designSystem = outputFormat.includes('HTML')
    ? true
    : await confirm('  Include Dev Labs design system reference template?', false);

  const mcpDependencies = await askList(
    '  MCP server dependencies (e.g. "exa", "hubspot", "google-workspace")',
    []
  );

  console.log(chalk.dim('\n  Define the sections this skill should produce in its output:'));
  const sections = await askList('  Output sections', [
    'Executive Summary',
    'Key Findings',
    'Analysis',
    'Recommendations',
    'Next Steps',
  ]);

  console.log(chalk.dim('\n  Define the steps the skill follows to produce output:'));
  const steps = await askList('  Skill steps', [
    'Research the topic using available tools',
    'Synthesize findings into structured format',
    'Generate the output document',
    'Review for accuracy and completeness',
  ]);

  const input: SkillWizardInput = {
    name,
    displayName,
    description,
    invocationCommand,
    invocationArgs,
    outputFormat,
    designSystem,
    mcpDependencies,
    sections,
    steps,
  };

  console.log(chalk.blue('\n  Generating skill files...'));
  await generateSkill(input);
  console.log(chalk.green(`\n  Skill "${displayName}" created at Skills/${displayName}/`));
  console.log(chalk.dim(`  Files: SKILL.md${designSystem ? ', reference/' : ''}\n`));

  closePrompt();
}

/**
 * Generates skill files from wizard input (used by both CLI and API).
 */
export async function generateSkill(input: SkillWizardInput): Promise<string> {
  const skillDir = path.join(getProjectRoot(), 'Skills', input.displayName);
  await ensureDir(skillDir);

  // Generate SKILL.md
  const skillMd = generateSkillMd(input);
  await writeText(path.join(skillDir, 'SKILL.md'), skillMd);

  // Generate reference template if using design system
  if (input.designSystem) {
    await ensureDir(path.join(skillDir, 'reference'));
    const refHtml = generateReferenceTemplate(input);
    await writeText(path.join(skillDir, 'reference', `${input.name}-template.html`), refHtml);
  }

  return skillDir;
}

function generateSkillMd(input: SkillWizardInput): string {
  const sections: string[] = [];

  sections.push(`# ${input.displayName}\n`);

  sections.push(`${input.description}\n`);

  sections.push(`## Invocation\n`);
  sections.push('```');
  sections.push(`${input.invocationCommand} ${input.invocationArgs}`);
  sections.push('```\n');

  if (input.mcpDependencies.length > 0) {
    sections.push(`## MCP Dependencies\n`);
    input.mcpDependencies.forEach((dep) => {
      sections.push(`- ${dep} MCP server`);
    });
    sections.push('');
  }

  sections.push(`## Workflow\n`);
  sections.push(`When invoked, follow these steps:\n`);
  input.steps.forEach((step, i) => {
    sections.push(`${i + 1}. ${step}`);
  });
  sections.push('');

  sections.push(`## Output Format\n`);
  sections.push(`Format: ${input.outputFormat}\n`);

  if (input.sections.length > 0) {
    sections.push(`### Required Sections\n`);
    sections.push(`Every output must include these sections:\n`);
    input.sections.forEach((s, i) => {
      sections.push(`${i + 1}. **${s}**`);
    });
    sections.push('');
  }

  if (input.designSystem) {
    sections.push(`## Design System\n`);
    sections.push(`Output must match the Dev Labs design system exactly:\n`);
    sections.push(`- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981)`);
    sections.push(`- **Layout**: 280px fixed sidebar, 900px max content width`);
    sections.push(`- **Typography**: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif`);
    sections.push(`- **Components**: Sections, bullets, steps, tables, info boxes, metrics`);
    sections.push(`\nSee \`reference/${input.name}-template.html\` for the complete template.\n`);
  }

  sections.push(`## Quality Checks\n`);
  sections.push(`Before returning output:\n`);
  sections.push(`1. Verify all required sections are present`);
  sections.push(`2. Ensure no fabricated data or placeholder text`);
  sections.push(`3. Confirm output matches the specified format`);
  sections.push(`4. Check that all cited sources are real and accessible`);

  return sections.join('\n');
}

function generateReferenceTemplate(input: SkillWizardInput): string {
  const sectionHtml = input.sections
    .map(
      (s, i) => `
    <section class="section" id="section-${i + 1}">
      <div class="section-number">${String(i + 1).padStart(2, '0')}</div>
      <h2>${s}</h2>
      <p>[Content for ${s}]</p>
    </section>`
    )
    .join('\n');

  const sidebarLinks = input.sections
    .map(
      (s, i) =>
        `        <a href="#section-${i + 1}" class="nav-link">${String(i + 1).padStart(2, '0')}. ${s}</a>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${input.displayName}</title>
  <style>
    :root {
      --navy: #1a1a2e;
      --navy-light: #16213e;
      --accent: #4361ee;
      --emerald: #10b981;
      --text: #e2e8f0;
      --text-dim: #94a3b8;
      --border: #334155;
      --sidebar-width: 280px;
      --content-max: 900px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      background: var(--navy);
      color: var(--text);
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: var(--sidebar-width);
      background: #0f0f1a;
      border-right: 1px solid var(--border);
      padding: 2rem 1.5rem;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }
    .sidebar h1 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem; }
    .sidebar .subtitle { font-size: 0.75rem; color: var(--text-dim); margin-bottom: 2rem; }
    .nav-link {
      display: block;
      padding: 0.5rem 0;
      color: var(--text-dim);
      text-decoration: none;
      font-size: 0.8rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: color 0.2s;
    }
    .nav-link:hover { color: var(--accent); }
    .content {
      margin-left: var(--sidebar-width);
      max-width: var(--content-max);
      padding: 3rem 4rem;
      flex: 1;
    }
    .section {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .section-number {
      font-size: 0.7rem;
      color: var(--accent);
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    .section h2 { font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem; }
    .section p { color: var(--text-dim); line-height: 1.7; }
  </style>
</head>
<body>
  <nav class="sidebar">
    <h1>${input.displayName}</h1>
    <p class="subtitle">Generated by TheLibrary</p>
${sidebarLinks}
  </nav>
  <main class="content">
${sectionHtml}
  </main>
</body>
</html>`;
}
