/**
 * Technical documentation Markdown generator for SpecKit features.
 *
 * Reads a feature directory (spec.md, plan.md, tasks.md, data-model.md,
 * contracts/) and produces a single comprehensive .md reference file with
 * a line-number-annotated table of contents so Claude Code can navigate
 * directly to each section.
 *
 * Output location: references/knowledgebase/{feature-name}.md
 */

import path from 'path';
import fs from 'fs-extra';
import { readText, exists, ensureDir, writeText, getProjectRoot } from '../utils/file-ops.js';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** A named section of the generated document. */
interface DocSection {
  /** Heading text (without leading ##). */
  title: string;
  /** Anchor slug for the TOC link. */
  anchor: string;
  /** Full markdown body including the heading line. */
  body: string;
}

/** Line-number metadata calculated after content assembly. */
interface TocEntry {
  title: string;
  anchor: string;
  startLine: number;
  endLine: number;
}

/* ------------------------------------------------------------------ */
/*  Source file readers                                                 */
/* ------------------------------------------------------------------ */

/**
 * Reads all markdown files from a contracts/ subdirectory and returns
 * them concatenated with sub-headings per contract file.
 */
async function readContracts(featureDir: string): Promise<string | null> {
  const contractsDir = path.join(featureDir, 'contracts');
  if (!(await exists(contractsDir))) {
    return null;
  }

  const entries = await fs.readdir(contractsDir, { withFileTypes: true });
  const mdFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (mdFiles.length === 0) {
    return null;
  }

  const parts: string[] = [];
  for (const file of mdFiles) {
    const content = await readText(path.join(contractsDir, file.name));
    if (content && content.trim().length > 0) {
      const label = file.name.replace(/\.md$/, '').replace(/[-_]/g, ' ');
      parts.push(`### ${label}\n\n${content.trim()}`);
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

/* ------------------------------------------------------------------ */
/*  Section extractors                                                 */
/* ------------------------------------------------------------------ */

/**
 * Extracts the feature name from the first H1 heading in spec.md.
 * Falls back to the directory name if no H1 is found.
 */
function extractFeatureName(specContent: string, featureDir: string): string {
  const match = specContent.match(/^#\s+(?:Feature Specification:\s*)?(.+)/m);
  if (match) {
    return match[1].trim();
  }
  return path.basename(featureDir);
}

/**
 * Extracts a kebab-case slug from the feature name for use in file naming.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extracts user stories from spec.md content.
 * Looks for ### User Story headings and their content.
 */
function extractUserStories(specContent: string): string | null {
  const storyRegex = /^###\s+User Story\s+.+$/gm;
  const matches = [...specContent.matchAll(storyRegex)];

  if (matches.length === 0) {
    return null;
  }

  // Extract from first user story heading to the next ## heading or end of content
  const firstIdx = specContent.indexOf(matches[0][0]);
  const afterStories = specContent.indexOf('\n## ', firstIdx + 1);
  const storiesBlock =
    afterStories !== -1
      ? specContent.slice(firstIdx, afterStories).trim()
      : specContent.slice(firstIdx).trim();

  return storiesBlock.length > 0 ? storiesBlock : null;
}

/**
 * Extracts requirements / acceptance scenarios from spec.md.
 * Captures the content under "Acceptance Scenarios" sub-headings.
 */
function extractRequirements(specContent: string): string | null {
  const lines = specContent.split('\n');
  const requirements: string[] = [];
  let capturing = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\*\*Acceptance Scenarios\*\*/.test(line)) {
      capturing = true;
      requirements.push(line);
      continue;
    }

    if (capturing) {
      // Stop at the next heading that is ## or ### User Story
      if (/^###\s+User Story/.test(line) || /^##\s+/.test(line)) {
        capturing = false;
        requirements.push('');
        // Check if this is a new acceptance block
        continue;
      }
      requirements.push(line);
    }
  }

  const text = requirements.join('\n').trim();
  return text.length > 0 ? text : null;
}

/**
 * Extracts the success criteria section from spec.md.
 * Looks for a ## Success Criteria or ## Acceptance heading.
 */
function extractSuccessCriteria(specContent: string): string | null {
  const headingPattern = /^##\s+(Success Criteria|Acceptance Criteria|Done When)/im;
  const match = specContent.match(headingPattern);

  if (!match || match.index === undefined) {
    return null;
  }

  const startIdx = match.index + match[0].length;
  const nextHeading = specContent.indexOf('\n## ', startIdx);
  const block =
    nextHeading !== -1
      ? specContent.slice(startIdx, nextHeading).trim()
      : specContent.slice(startIdx).trim();

  return block.length > 0 ? block : null;
}

/**
 * Extracts the architecture / technical context section from plan.md.
 */
function extractArchitecture(planContent: string): string | null {
  // Look for Technical Context, Architecture, or Summary sections
  const sections = ['Technical Context', 'Architecture', 'Summary'];
  const parts: string[] = [];

  for (const sectionName of sections) {
    const pattern = new RegExp(`^##\\s+${sectionName}`, 'm');
    const match = planContent.match(pattern);
    if (match && match.index !== undefined) {
      const startIdx = match.index;
      const afterHeading = planContent.indexOf('\n', startIdx);
      const nextHeading = planContent.indexOf('\n## ', afterHeading);
      const block =
        nextHeading !== -1
          ? planContent.slice(startIdx, nextHeading).trim()
          : planContent.slice(startIdx).trim();
      if (block.length > 0) {
        parts.push(block);
      }
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

/* ------------------------------------------------------------------ */
/*  Section builders                                                   */
/* ------------------------------------------------------------------ */

/**
 * Builds an array of DocSection objects from the available source data.
 * Only includes sections for which source content exists.
 */
function buildSections(
  featureName: string,
  specContent: string,
  planContent: string | null,
  tasksContent: string | null,
  dataModelContent: string | null,
  contractsContent: string | null
): DocSection[] {
  const sections: DocSection[] = [];

  // --- Overview ---
  // Use the spec preamble (everything before the first ### heading) as the overview.
  const firstSubHeading = specContent.indexOf('\n### ');
  const overview =
    firstSubHeading !== -1
      ? specContent
          .slice(specContent.indexOf('\n', 0), firstSubHeading)
          .trim()
          // Strip the H1 title since we already have it as the document title
          .replace(/^#\s+.+\n*/m, '')
          .trim()
      : specContent.replace(/^#\s+.+\n*/m, '').trim();

  if (overview.length > 0) {
    sections.push({
      title: 'Overview',
      anchor: 'overview',
      body: `## Overview\n\n${overview}`,
    });
  }

  // --- User Stories ---
  const stories = extractUserStories(specContent);
  if (stories) {
    sections.push({
      title: 'User Stories',
      anchor: 'user-stories',
      body: `## User Stories\n\n${stories}`,
    });
  }

  // --- Requirements ---
  const requirements = extractRequirements(specContent);
  if (requirements) {
    sections.push({
      title: 'Requirements',
      anchor: 'requirements',
      body: `## Requirements\n\n${requirements}`,
    });
  }

  // --- Architecture ---
  if (planContent) {
    const architecture = extractArchitecture(planContent);
    if (architecture) {
      sections.push({
        title: 'Architecture',
        anchor: 'architecture',
        body: `## Architecture\n\n${architecture}`,
      });
    }
  }

  // --- Data Model ---
  if (dataModelContent && dataModelContent.trim().length > 0) {
    // Strip the top-level H1 from data-model.md to avoid duplicate headings
    const stripped = dataModelContent.replace(/^#\s+.+\n*/m, '').trim();
    sections.push({
      title: 'Data Model',
      anchor: 'data-model',
      body: `## Data Model\n\n${stripped}`,
    });
  }

  // --- API Contracts ---
  if (contractsContent) {
    sections.push({
      title: 'API Contracts',
      anchor: 'api-contracts',
      body: `## API Contracts\n\n${contractsContent}`,
    });
  }

  // --- Tasks ---
  if (tasksContent && tasksContent.trim().length > 0) {
    const strippedTasks = tasksContent.replace(/^#\s+.+\n*/m, '').trim();
    sections.push({
      title: 'Tasks',
      anchor: 'tasks',
      body: `## Tasks\n\n${strippedTasks}`,
    });
  }

  // --- Success Criteria ---
  const criteria = extractSuccessCriteria(specContent);
  if (criteria) {
    sections.push({
      title: 'Success Criteria',
      anchor: 'success-criteria',
      body: `## Success Criteria\n\n${criteria}`,
    });
  }

  return sections;
}

/* ------------------------------------------------------------------ */
/*  TOC and line-number calculation                                    */
/* ------------------------------------------------------------------ */

/**
 * Calculates the line number range for each section within the full
 * document body (after the TOC is prepended).
 *
 * @param tocLineCount - Number of lines the TOC block occupies (including trailing blank line).
 * @param sectionsText - The concatenated section body text.
 * @param sections - The ordered section descriptors.
 * @returns An array of TocEntry with accurate line numbers.
 */
function calculateLineNumbers(
  tocLineCount: number,
  sectionsText: string,
  sections: DocSection[]
): TocEntry[] {
  const lines = sectionsText.split('\n');
  const entries: TocEntry[] = [];

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const headingLine = `## ${section.title}`;

    // Find the line index where this section heading appears
    const headingIdx = lines.findIndex((l) => l === headingLine);
    if (headingIdx === -1) {
      continue;
    }

    // The start line in the final document = tocLineCount + headingIdx + 1 (1-indexed)
    const startLine = tocLineCount + headingIdx + 1;

    // End line: the line before the next section heading, or the last line of the document
    let endLineIdx: number;
    if (si < sections.length - 1) {
      const nextHeading = `## ${sections[si + 1].title}`;
      const nextIdx = lines.findIndex((l, idx) => idx > headingIdx && l === nextHeading);
      endLineIdx = nextIdx !== -1 ? nextIdx - 1 : lines.length - 1;
    } else {
      endLineIdx = lines.length - 1;
    }

    // Skip trailing blank lines for a tighter range
    while (endLineIdx > headingIdx && lines[endLineIdx].trim() === '') {
      endLineIdx--;
    }

    const endLine = tocLineCount + endLineIdx + 1;

    entries.push({
      title: section.title,
      anchor: section.anchor,
      startLine,
      endLine,
    });
  }

  return entries;
}

/**
 * Builds the table of contents block with line number annotations.
 */
function buildToc(entries: TocEntry[]): string {
  const tocLines: string[] = ['# Table of Contents', ''];

  for (const entry of entries) {
    tocLines.push(
      `- [${entry.title}](#${entry.anchor}) [L${entry.startLine}-L${entry.endLine}]`
    );
  }

  tocLines.push('');
  return tocLines.join('\n');
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Generates a comprehensive Markdown technical documentation file for a
 * SpecKit feature, designed for Claude Code navigation.
 *
 * Reads whatever source files exist in the feature directory (spec.md is
 * required; plan.md, tasks.md, data-model.md, and contracts/ are optional),
 * assembles them into a single document with a table of contents annotated
 * with line number ranges, and writes the output to
 * `{outputDir}/references/knowledgebase/{feature-slug}.md`.
 *
 * @param featureDir - Absolute path to the feature directory containing
 *   spec.md and optional companion files.
 * @param outputDir - Absolute path to the project root where the
 *   `references/knowledgebase/` directory will be created.
 * @returns The absolute path to the generated .md file.
 * @throws {Error} If spec.md is missing or unreadable.
 */
export async function generateTechnicalDocsMd(
  featureDir: string,
  outputDir: string
): Promise<string> {
  // ---- 1. Read source files ------------------------------------------------

  const specPath = path.join(featureDir, 'spec.md');
  const specContent = await readText(specPath);

  if (!specContent) {
    throw new Error(`spec.md is required but was not found at ${specPath}`);
  }

  const [planContent, tasksContent, dataModelContent, contractsContent] =
    await Promise.all([
      readText(path.join(featureDir, 'plan.md')),
      readText(path.join(featureDir, 'tasks.md')),
      readText(path.join(featureDir, 'data-model.md')),
      readContracts(featureDir),
    ]);

  // ---- 2. Derive names -----------------------------------------------------

  const featureName = extractFeatureName(specContent, featureDir);
  const featureSlug = slugify(featureName);

  // ---- 3. Build sections ----------------------------------------------------

  const sections = buildSections(
    featureName,
    specContent,
    planContent,
    tasksContent,
    dataModelContent,
    contractsContent
  );

  if (sections.length === 0) {
    throw new Error(
      `No sections could be generated from the feature directory: ${featureDir}`
    );
  }

  // ---- 4. Assemble body text (without TOC) ----------------------------------

  const titleBlock = `# ${featureName}\n\n`;
  const generatedNote = `> Generated by SpecKit on ${new Date().toISOString().slice(0, 10)}\n\n`;
  const sectionsText = sections.map((s) => s.body).join('\n\n');

  // ---- 5. Calculate line numbers --------------------------------------------
  // We need to know how many lines the TOC will occupy so we can compute
  // accurate line numbers for each section.  Since the TOC length depends on
  // how many entries there are (which we already know), we can pre-calculate it.

  // TOC structure:
  //   "# Table of Contents"  (1 line)
  //   ""                     (1 blank line)
  //   one line per entry     (sections.length lines)
  //   ""                     (1 trailing blank line)
  const tocBlockLineCount = 2 + sections.length + 1;

  // Lines before the sections body: title (2 lines) + generated note (2 lines)
  const preambleText = titleBlock + generatedNote;
  const preambleLineCount = preambleText.split('\n').length - 1; // -1 because split adds an empty element for trailing \n

  const totalPrefixLines = tocBlockLineCount + preambleLineCount;

  const tocEntries = calculateLineNumbers(totalPrefixLines, sectionsText, sections);
  const tocBlock = buildToc(tocEntries);

  // ---- 6. Assemble the final document ---------------------------------------

  const document = tocBlock + preambleText + sectionsText + '\n';

  // ---- 7. Write output file -------------------------------------------------

  const knowledgebaseDir = path.join(outputDir, 'references', 'knowledgebase');
  await ensureDir(knowledgebaseDir);

  const outputPath = path.join(knowledgebaseDir, `${featureSlug}.md`);
  await writeText(outputPath, document);

  return outputPath;
}
