/**
 * Technical documentation HTML generator.
 *
 * Reads the markdown source files from a SpecKit feature directory
 * (spec.md, plan.md, tasks.md, data-model.md, contracts/*) and produces
 * a single, self-contained HTML document styled with the Dev Labs dark
 * design system. The document includes a cover page, numbered sections
 * with sidebar navigation, and only renders sections for which source
 * data exists.
 */

import path from 'path';
import fs from 'fs-extra';
import { readText, exists, ensureDir, writeText } from '../utils/file-ops.js';

/* ------------------------------------------------------------------ */
/*  Design-system tokens                                               */
/* ------------------------------------------------------------------ */

const TOKENS = {
  navy: '#1a1a2e',
  accentBlue: '#4361ee',
  emerald: '#10b981',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  border: '#334155',
  sidebarWidth: '280px',
  contentMax: '900px',
  fontStack: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** A numbered section ready for rendering. */
interface DocSection {
  /** Two-digit section number, e.g. "01" */
  number: string;
  /** Human-readable title */
  title: string;
  /** Section anchor id */
  id: string;
  /** Pre-escaped HTML body */
  html: string;
}

/** Raw source material collected from the feature directory. */
interface SourceFiles {
  spec: string;
  plan: string | null;
  tasks: string | null;
  dataModel: string | null;
  contracts: { name: string; content: string }[];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Generates a self-contained HTML technical documentation file for a
 * SpecKit feature.
 *
 * Reads whatever markdown source files exist inside `featureDir`
 * (spec.md is required; plan.md, tasks.md, data-model.md and
 * contracts/*.md are optional) and writes a styled HTML document to
 * `{outputDir}/references/technical docs/{feature-name}.html`.
 *
 * @param featureDir - Absolute path to the feature spec directory
 *   (e.g. `/project/specs/1-my-feature`).
 * @param outputDir  - Absolute path to the project root where the
 *   `references/technical docs/` directory will be created.
 * @returns The absolute path of the generated HTML file.
 *
 * @throws {Error} If `spec.md` does not exist inside `featureDir`.
 *
 * @example
 * ```ts
 * const htmlPath = await generateTechnicalDocsHtml(
 *   '/project/specs/1-cool-feature',
 *   '/project'
 * );
 * // => '/project/references/technical docs/cool-feature.html'
 * ```
 */
export async function generateTechnicalDocsHtml(
  featureDir: string,
  outputDir: string,
): Promise<string> {
  /* 1. Gather source files ----------------------------------------- */
  const sources = await collectSources(featureDir);

  /* 2. Derive feature metadata ------------------------------------- */
  const featureName = extractFeatureName(sources.spec);
  const featureSlug = slugify(featureName);
  const generatedDate = new Date().toISOString().slice(0, 10);
  const status = extractStatus(sources.spec);

  /* 3. Build sections ---------------------------------------------- */
  const sections = buildSections(sources);

  /* 4. Render HTML ------------------------------------------------- */
  const html = renderHtml({ featureName, generatedDate, status, sections });

  /* 5. Write to disk ----------------------------------------------- */
  const destDir = path.join(outputDir, 'references', 'technical docs');
  await ensureDir(destDir);
  const destPath = path.join(destDir, `${featureSlug}.html`);
  await writeText(destPath, html);

  return destPath;
}

/* ------------------------------------------------------------------ */
/*  Source collection                                                   */
/* ------------------------------------------------------------------ */

/**
 * Reads all relevant markdown files from the feature directory.
 * Throws if spec.md is missing.
 */
async function collectSources(featureDir: string): Promise<SourceFiles> {
  const specPath = path.join(featureDir, 'spec.md');

  if (!(await exists(specPath))) {
    throw new Error(`spec.md not found in ${featureDir}. It is required for technical documentation generation.`);
  }

  const spec = (await readText(specPath))!;
  const plan = await readText(path.join(featureDir, 'plan.md'));
  const tasks = await readText(path.join(featureDir, 'tasks.md'));
  const dataModel = await readText(path.join(featureDir, 'data-model.md'));

  const contracts: { name: string; content: string }[] = [];
  const contractsDir = path.join(featureDir, 'contracts');

  if (await exists(contractsDir)) {
    const entries = await fs.readdir(contractsDir);
    for (const entry of entries) {
      if (entry.endsWith('.md')) {
        const content = await readText(path.join(contractsDir, entry));
        if (content) {
          contracts.push({ name: entry.replace(/\.md$/, ''), content });
        }
      }
    }
  }

  return { spec, plan, tasks, dataModel, contracts };
}

/* ------------------------------------------------------------------ */
/*  Section builders                                                   */
/* ------------------------------------------------------------------ */

/**
 * Builds an ordered list of numbered sections from the collected
 * source material.  Sections are only included when their underlying
 * source data exists.
 */
function buildSections(sources: SourceFiles): DocSection[] {
  const sections: DocSection[] = [];
  let counter = 1;

  /** Helper to push a section and auto-number it. */
  const add = (title: string, id: string, html: string): void => {
    sections.push({
      number: String(counter).padStart(2, '0'),
      title,
      id,
      html,
    });
    counter++;
  };

  /* -- Overview (always present -- derived from spec.md) ----------- */
  add('Overview', 'overview', buildOverviewHtml(sources.spec));

  /* -- User Stories (from spec.md if section exists) --------------- */
  const userStoriesHtml = extractSectionHtml(sources.spec, /^##\s+User\s+Scenarios?\s+[&\s]*Testing/i);
  if (userStoriesHtml) {
    add('User Stories', 'user-stories', userStoriesHtml);
  }

  /* -- Requirements (from spec.md if section exists) --------------- */
  const requirementsHtml = extractSectionHtml(sources.spec, /^##\s+(Functional\s+)?Requirements/i);
  if (requirementsHtml) {
    add('Requirements', 'requirements', requirementsHtml);
  }

  /* -- Architecture (from plan.md) -------------------------------- */
  if (sources.plan) {
    add('Architecture', 'architecture', buildArchitectureHtml(sources.plan));
  }

  /* -- Data Model (from data-model.md) ---------------------------- */
  if (sources.dataModel) {
    add('Data Model', 'data-model', markdownToHtml(sources.dataModel));
  }

  /* -- API Contracts (from contracts/*.md) ------------------------- */
  if (sources.contracts.length > 0) {
    const contractHtmlParts = sources.contracts.map((c) => {
      const heading = `<h3>${escapeHtml(formatContractName(c.name))}</h3>`;
      return heading + markdownToHtml(c.content);
    });
    add('API Contracts', 'api-contracts', contractHtmlParts.join('\n'));
  }

  /* -- Tasks (from tasks.md) -------------------------------------- */
  if (sources.tasks) {
    add('Tasks', 'tasks', markdownToHtml(sources.tasks));
  }

  /* -- Success Criteria (from spec.md if section exists) ----------- */
  const successHtml = extractSectionHtml(sources.spec, /^##\s+Success\s+(Criteria|Metrics)/i);
  if (successHtml) {
    add('Success Criteria', 'success-criteria', successHtml);
  }

  return sections;
}

/**
 * Builds the Overview section HTML from the top of spec.md.
 * Extracts everything before the first `## ` heading.
 */
function buildOverviewHtml(spec: string): string {
  const lines = spec.split('\n');
  const overviewLines: string[] = [];

  let pastTitle = false;
  for (const line of lines) {
    if (!pastTitle) {
      // Skip the first H1 title line; it is rendered on the cover page
      if (/^#\s+/.test(line)) {
        pastTitle = true;
        continue;
      }
      continue;
    }
    // Stop at the first H2
    if (/^##\s+/.test(line)) break;
    overviewLines.push(line);
  }

  return markdownToHtml(overviewLines.join('\n').trim());
}

/**
 * Builds the Architecture section HTML from plan.md.
 * Includes Summary, Technical Context, Project Structure, and
 * any phase descriptions.
 */
function buildArchitectureHtml(plan: string): string {
  return markdownToHtml(plan);
}

/* ------------------------------------------------------------------ */
/*  Markdown extraction helpers                                        */
/* ------------------------------------------------------------------ */

/**
 * Extracts a top-level `## ` section from markdown content by matching
 * its heading against a regex. Returns the section body as HTML, or
 * null if not found.
 */
function extractSectionHtml(markdown: string, headingPattern: RegExp): string | null {
  const lines = markdown.split('\n');
  let capturing = false;
  const captured: string[] = [];

  for (const line of lines) {
    if (capturing) {
      // Stop at the next H2 heading
      if (/^##\s+/.test(line)) break;
      captured.push(line);
    } else if (headingPattern.test(line)) {
      capturing = true;
    }
  }

  if (captured.length === 0) return null;

  const body = captured.join('\n').trim();
  return body.length > 0 ? markdownToHtml(body) : null;
}

/* ------------------------------------------------------------------ */
/*  Lightweight Markdown -> HTML converter                             */
/* ------------------------------------------------------------------ */

/**
 * Converts a subset of Markdown to HTML. This is intentionally
 * minimal -- no external dependency required.  Handles headings,
 * paragraphs, bold, italic, inline code, code blocks, unordered
 * lists, ordered lists, horizontal rules, blockquotes, links, and
 * Markdown tables.
 */
function markdownToHtml(md: string): string {
  if (!md || md.trim().length === 0) return '';

  const lines = md.split('\n');
  const out: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeLines: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let inBlockquote = false;
  let tableState: 'none' | 'head' | 'body' = 'none';

  /** Flush any open list or blockquote. */
  const flushList = (): void => {
    if (inList) {
      out.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }
  };
  const flushBlockquote = (): void => {
    if (inBlockquote) {
      out.push('</blockquote>');
      inBlockquote = false;
    }
  };
  const flushTable = (): void => {
    if (tableState !== 'none') {
      if (tableState === 'body') out.push('</tbody>');
      out.push('</table>');
      tableState = 'none';
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    /* -- Fenced code blocks --------------------------------------- */
    if (/^```/.test(raw)) {
      if (!inCodeBlock) {
        flushList();
        flushBlockquote();
        flushTable();
        inCodeBlock = true;
        codeBlockLang = raw.replace(/^```/, '').trim();
        codeLines = [];
      } else {
        out.push(
          `<pre><code class="language-${escapeHtml(codeBlockLang)}">${escapeHtml(codeLines.join('\n'))}</code></pre>`,
        );
        inCodeBlock = false;
        codeBlockLang = '';
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(raw);
      continue;
    }

    const trimmed = raw.trim();

    /* -- Blank line ------------------------------------------------ */
    if (trimmed === '') {
      flushList();
      flushBlockquote();
      flushTable();
      continue;
    }

    /* -- Horizontal rule ------------------------------------------- */
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      flushList();
      flushBlockquote();
      flushTable();
      out.push('<hr />');
      continue;
    }

    /* -- Table rows ------------------------------------------------ */
    if (/^\|/.test(trimmed) && /\|$/.test(trimmed)) {
      flushList();
      flushBlockquote();

      // Separator row (e.g. |---|---|)
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        // Transition from header to body
        if (tableState === 'head') {
          out.push('</thead><tbody>');
          tableState = 'body';
        }
        continue;
      }

      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      if (tableState === 'none') {
        out.push('<table>');
        out.push('<thead>');
        out.push('<tr>' + cells.map((c) => `<th>${inlineMarkdown(c)}</th>`).join('') + '</tr>');
        tableState = 'head';
      } else {
        out.push('<tr>' + cells.map((c) => `<td>${inlineMarkdown(c)}</td>`).join('') + '</tr>');
      }
      continue;
    } else if (tableState !== 'none') {
      flushTable();
    }

    /* -- Headings -------------------------------------------------- */
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      flushList();
      flushBlockquote();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      out.push(`<h${level}>${inlineMarkdown(text)}</h${level}>`);
      continue;
    }

    /* -- Blockquote ------------------------------------------------ */
    if (/^>\s?/.test(trimmed)) {
      flushList();
      if (!inBlockquote) {
        out.push('<blockquote>');
        inBlockquote = true;
      }
      out.push(`<p>${inlineMarkdown(trimmed.replace(/^>\s?/, ''))}</p>`);
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    /* -- Unordered list -------------------------------------------- */
    if (/^[-*]\s+/.test(trimmed)) {
      if (inList !== 'ul') {
        flushList();
        out.push('<ul>');
        inList = 'ul';
      }
      out.push(`<li>${inlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    /* -- Ordered list ---------------------------------------------- */
    const olMatch = trimmed.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      if (inList !== 'ol') {
        flushList();
        out.push('<ol>');
        inList = 'ol';
      }
      out.push(`<li>${inlineMarkdown(olMatch[1])}</li>`);
      continue;
    }

    /* -- Checkbox list items --------------------------------------- */
    const checkboxMatch = trimmed.match(/^-\s+\[([ xX])\]\s+(.*)/);
    if (checkboxMatch) {
      if (inList !== 'ul') {
        flushList();
        out.push('<ul class="checklist">');
        inList = 'ul';
      }
      const checked = checkboxMatch[1] !== ' ';
      const icon = checked ? '&#9745;' : '&#9744;';
      out.push(`<li>${icon} ${inlineMarkdown(checkboxMatch[2])}</li>`);
      continue;
    }

    /* -- Paragraph ------------------------------------------------- */
    flushList();
    flushBlockquote();
    out.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  /* Close any open structures ------------------------------------- */
  if (inCodeBlock) {
    out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }
  flushList();
  flushBlockquote();
  flushTable();

  return out.join('\n');
}

/**
 * Converts inline Markdown (bold, italic, code, links) to HTML.
 */
function inlineMarkdown(text: string): string {
  let result = escapeHtml(text);

  // Inline code (must come before bold/italic to avoid conflicts)
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold + italic
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic (underscores)
  result = result.replace(/_(.+?)_/g, '<em>$1</em>');

  // Italic (asterisks)
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  return result;
}

/* ------------------------------------------------------------------ */
/*  Metadata extractors                                                */
/* ------------------------------------------------------------------ */

/**
 * Extracts the feature name from the first H1 heading in spec.md.
 * Falls back to "Untitled Feature" if no heading is found.
 */
function extractFeatureName(spec: string): string {
  const match = spec.match(/^#\s+(?:Feature\s+Specification:\s*)?(.+)/m);
  return match ? match[1].trim() : 'Untitled Feature';
}

/**
 * Extracts the status value from a `**Status**: <value>` line.
 */
function extractStatus(spec: string): string {
  const match = spec.match(/\*\*Status\*\*:\s*(.+)/);
  return match ? match[1].trim() : 'Draft';
}

/* ------------------------------------------------------------------ */
/*  String utilities                                                   */
/* ------------------------------------------------------------------ */

/**
 * Creates a URL-safe slug from a feature name.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts a contract file name like "dashboard-api" to a readable
 * title: "Dashboard Api".
 */
function formatContractName(name: string): string {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Escapes HTML special characters.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ------------------------------------------------------------------ */
/*  HTML renderer                                                      */
/* ------------------------------------------------------------------ */

/**
 * Assembles the complete HTML document string.
 */
function renderHtml(opts: {
  featureName: string;
  generatedDate: string;
  status: string;
  sections: DocSection[];
}): string {
  const { featureName, generatedDate, status, sections } = opts;

  const sidebarLinks = sections
    .map(
      (s) =>
        `        <a href="#${s.id}" class="nav-link" data-section="${s.id}">${s.number}. ${escapeHtml(s.title)}</a>`,
    )
    .join('\n');

  const sectionBlocks = sections
    .map(
      (s) => `
      <section id="${s.id}" class="doc-section">
        <div class="section-number">${s.number}</div>
        <h2 class="section-title">${escapeHtml(s.title)}</h2>
        <div class="section-body">
          ${s.html}
        </div>
      </section>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(featureName)} - Technical Documentation</title>
  <style>
    /* ============================================================= */
    /*  Dev Labs Design System - Dark Theme                          */
    /* ============================================================= */

    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: ${TOKENS.fontStack};
      background: ${TOKENS.navy};
      color: ${TOKENS.text};
      line-height: 1.7;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
    }

    /* ------------------------------------------------------------- */
    /*  Cover Page                                                    */
    /* ------------------------------------------------------------- */

    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 2rem;
      background: linear-gradient(
        160deg,
        ${TOKENS.navy} 0%,
        #16213e 50%,
        ${TOKENS.navy} 100%
      );
      border-bottom: 1px solid ${TOKENS.border};
    }

    .cover-badge {
      display: inline-block;
      padding: 0.35rem 1rem;
      border: 1px solid ${TOKENS.accentBlue};
      border-radius: 9999px;
      color: ${TOKENS.accentBlue};
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 2rem;
    }

    .cover h1 {
      font-size: 2.75rem;
      font-weight: 700;
      color: ${TOKENS.text};
      max-width: 700px;
      line-height: 1.25;
      margin-bottom: 1.5rem;
    }

    .cover-meta {
      display: flex;
      gap: 2rem;
      color: ${TOKENS.textDim};
      font-size: 0.9rem;
    }

    .cover-meta span {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .status-chip {
      display: inline-block;
      padding: 0.2rem 0.65rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      background: ${TOKENS.emerald}22;
      color: ${TOKENS.emerald};
      border: 1px solid ${TOKENS.emerald}44;
    }

    .cover-start {
      margin-top: 3rem;
    }

    .cover-start a {
      color: ${TOKENS.accentBlue};
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      padding: 0.6rem 1.5rem;
      border: 1px solid ${TOKENS.accentBlue}44;
      border-radius: 6px;
      transition: background 0.2s, border-color 0.2s;
    }

    .cover-start a:hover {
      background: ${TOKENS.accentBlue}11;
      border-color: ${TOKENS.accentBlue};
    }

    /* ------------------------------------------------------------- */
    /*  Layout: Sidebar + Content                                     */
    /* ------------------------------------------------------------- */

    .layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: ${TOKENS.sidebarWidth};
      height: 100vh;
      overflow-y: auto;
      background: #111827;
      border-right: 1px solid ${TOKENS.border};
      padding: 2rem 0;
      z-index: 100;
    }

    .sidebar-title {
      padding: 0 1.25rem 1.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${TOKENS.textDim};
      border-bottom: 1px solid ${TOKENS.border};
      margin-bottom: 1rem;
    }

    .nav-link {
      display: block;
      padding: 0.55rem 1.25rem;
      font-size: 0.85rem;
      color: ${TOKENS.textDim};
      text-decoration: none;
      border-left: 3px solid transparent;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
    }

    .nav-link:hover {
      color: ${TOKENS.text};
      background: ${TOKENS.accentBlue}0a;
    }

    .nav-link.active {
      color: ${TOKENS.accentBlue};
      border-left-color: ${TOKENS.accentBlue};
      background: ${TOKENS.accentBlue}0f;
    }

    .content {
      margin-left: ${TOKENS.sidebarWidth};
      flex: 1;
      padding: 3rem 4rem 6rem;
      max-width: calc(${TOKENS.contentMax} + 8rem);
    }

    /* ------------------------------------------------------------- */
    /*  Sections                                                      */
    /* ------------------------------------------------------------- */

    .doc-section {
      margin-bottom: 4rem;
      padding-top: 1rem;
    }

    .section-number {
      font-size: 0.7rem;
      font-weight: 700;
      color: ${TOKENS.accentBlue};
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 0.35rem;
    }

    .section-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: ${TOKENS.text};
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid ${TOKENS.border};
    }

    .section-body {
      color: ${TOKENS.text};
    }

    /* ------------------------------------------------------------- */
    /*  Typography within sections                                    */
    /* ------------------------------------------------------------- */

    .section-body h2 {
      font-size: 1.35rem;
      font-weight: 600;
      margin: 2.5rem 0 1rem;
      color: ${TOKENS.text};
    }

    .section-body h3 {
      font-size: 1.15rem;
      font-weight: 600;
      margin: 2rem 0 0.75rem;
      color: ${TOKENS.text};
    }

    .section-body h4 {
      font-size: 1rem;
      font-weight: 600;
      margin: 1.5rem 0 0.5rem;
      color: ${TOKENS.textDim};
    }

    .section-body p {
      margin-bottom: 1rem;
    }

    .section-body a {
      color: ${TOKENS.accentBlue};
      text-decoration: none;
    }

    .section-body a:hover {
      text-decoration: underline;
    }

    .section-body strong {
      color: ${TOKENS.text};
      font-weight: 600;
    }

    .section-body em {
      color: ${TOKENS.textDim};
      font-style: italic;
    }

    .section-body code {
      background: #0f172a;
      color: ${TOKENS.emerald};
      padding: 0.15em 0.4em;
      border-radius: 4px;
      font-size: 0.88em;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    }

    .section-body pre {
      background: #0f172a;
      border: 1px solid ${TOKENS.border};
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      overflow-x: auto;
      margin: 1.25rem 0;
      line-height: 1.55;
    }

    .section-body pre code {
      background: none;
      padding: 0;
      color: ${TOKENS.text};
      font-size: 0.85rem;
    }

    .section-body blockquote {
      border-left: 3px solid ${TOKENS.accentBlue};
      padding: 0.75rem 1.25rem;
      margin: 1.25rem 0;
      background: ${TOKENS.accentBlue}08;
      border-radius: 0 6px 6px 0;
      color: ${TOKENS.textDim};
    }

    .section-body blockquote p {
      margin-bottom: 0.5rem;
    }

    .section-body blockquote p:last-child {
      margin-bottom: 0;
    }

    .section-body hr {
      border: none;
      border-top: 1px solid ${TOKENS.border};
      margin: 2rem 0;
    }

    /* Lists */

    .section-body ul,
    .section-body ol {
      margin: 0.75rem 0 1rem 1.5rem;
    }

    .section-body li {
      margin-bottom: 0.4rem;
    }

    .section-body ul.checklist {
      list-style: none;
      margin-left: 0;
    }

    .section-body ul.checklist li {
      padding: 0.2rem 0;
    }

    /* Tables */

    .section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.25rem 0;
      font-size: 0.88rem;
    }

    .section-body th,
    .section-body td {
      padding: 0.65rem 1rem;
      text-align: left;
      border: 1px solid ${TOKENS.border};
    }

    .section-body th {
      background: #111827;
      font-weight: 600;
      color: ${TOKENS.text};
      white-space: nowrap;
    }

    .section-body td {
      color: ${TOKENS.textDim};
    }

    .section-body tr:hover td {
      background: ${TOKENS.accentBlue}06;
    }

    /* ------------------------------------------------------------- */
    /*  Footer                                                        */
    /* ------------------------------------------------------------- */

    .doc-footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid ${TOKENS.border};
      text-align: center;
      color: ${TOKENS.textDim};
      font-size: 0.8rem;
    }

    /* ------------------------------------------------------------- */
    /*  Responsive                                                    */
    /* ------------------------------------------------------------- */

    @media (max-width: 900px) {
      .sidebar {
        display: none;
      }
      .content {
        margin-left: 0;
        padding: 2rem 1.5rem 4rem;
      }
    }

    /* ------------------------------------------------------------- */
    /*  Print                                                         */
    /* ------------------------------------------------------------- */

    @media print {
      .sidebar, .cover-start {
        display: none;
      }
      .content {
        margin-left: 0;
      }
      body {
        background: white;
        color: #1a1a1a;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <div class="cover-badge">Technical Documentation</div>
    <h1>${escapeHtml(featureName)}</h1>
    <div class="cover-meta">
      <span>Generated: ${escapeHtml(generatedDate)}</span>
      <span>Status: <span class="status-chip">${escapeHtml(status)}</span></span>
    </div>
    <div class="cover-start">
      <a href="#${sections.length > 0 ? sections[0].id : 'overview'}">Begin Reading</a>
    </div>
  </div>

  <!-- Sidebar + Content -->
  <div class="layout">
    <nav class="sidebar">
      <div class="sidebar-title">Contents</div>
${sidebarLinks}
    </nav>
    <main class="content">
${sectionBlocks}

      <div class="doc-footer">
        Generated by SpecKit Technical Docs Generator &middot; ${escapeHtml(generatedDate)}
      </div>
    </main>
  </div>

  <!-- Active section highlighting -->
  <script>
    (function () {
      var links = document.querySelectorAll('.nav-link');
      var sections = document.querySelectorAll('.doc-section');

      if (!sections.length) return;

      /** Determines which section is currently in view. */
      function updateActive() {
        var scrollY = window.scrollY || document.documentElement.scrollTop;
        var current = '';

        for (var i = 0; i < sections.length; i++) {
          var top = sections[i].getBoundingClientRect().top + scrollY - 120;
          if (scrollY >= top) {
            current = sections[i].id;
          }
        }

        for (var j = 0; j < links.length; j++) {
          if (links[j].getAttribute('data-section') === current) {
            links[j].classList.add('active');
          } else {
            links[j].classList.remove('active');
          }
        }
      }

      window.addEventListener('scroll', updateActive, { passive: true });
      updateActive();
    })();
  </script>
</body>
</html>`;
}
