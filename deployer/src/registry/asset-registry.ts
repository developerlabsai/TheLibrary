/**
 * Asset registry - central catalog of all available agents, skills,
 * MCP servers, and templates in TheLibrary.
 */

import path from 'path';
import fs from 'fs-extra';
import { getProjectRoot, readJson, exists } from '../utils/file-ops.js';
import type { AgentManifest, SkillInfo, WorkforcePackage } from '../types.js';

/**
 * Scans the library and returns all available agents.
 */
export async function getAllAgents(): Promise<AgentManifest[]> {
  const agentsDir = path.join(getProjectRoot(), 'Agents');
  if (!(await exists(agentsDir))) return [];

  const entries = await fs.readdir(agentsDir, { withFileTypes: true });
  const agents: AgentManifest[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const manifest = await readJson<AgentManifest>(
      path.join(agentsDir, entry.name, 'manifest.json')
    );
    if (manifest) agents.push(manifest);
  }

  return agents;
}

/**
 * Scans the library and returns all available skills.
 */
export async function getAllSkills(): Promise<SkillInfo[]> {
  const skillsDir = path.join(getProjectRoot(), 'Skills');
  if (!(await exists(skillsDir))) return [];

  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skills: SkillInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const skillMdPath = path.join(skillsDir, entry.name, 'SKILL.md');
    const hasSkillMd = await exists(skillMdPath);
    const hasReference = await exists(path.join(skillsDir, entry.name, 'reference'));

    skills.push({
      name: entry.name.toLowerCase().replace(/\s+/g, '-'),
      displayName: entry.name,
      version: '1.0.0',
      description: hasSkillMd ? await extractSkillDescription(skillMdPath) : '',
      directory: entry.name,
      hasReference,
      requiredMcp: [],
    });
  }

  return skills;
}

/**
 * Scans the library and returns all available templates.
 */
export async function getAllTemplates(): Promise<string[]> {
  const templatesDir = path.join(getProjectRoot(), 'Templates');
  if (!(await exists(templatesDir))) return [];

  const entries = await fs.readdir(templatesDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && (e.name.endsWith('.html') || e.name.endsWith('.css')))
    .map((e) => e.name);
}

/**
 * Scans the Packages directory and returns all workforce packages.
 */
export async function getAllPackages(): Promise<WorkforcePackage[]> {
  const packagesDir = path.join(getProjectRoot(), 'Packages');
  if (!(await exists(packagesDir))) return [];

  const entries = await fs.readdir(packagesDir, { withFileTypes: true });
  const packages: WorkforcePackage[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const pkg = await readJson<WorkforcePackage>(
      path.join(packagesDir, entry.name, 'package.json')
    );
    if (pkg) packages.push(pkg);
  }

  return packages;
}

/**
 * Extracts the description from a SKILL.md file (first non-empty paragraph).
 */
async function extractSkillDescription(skillMdPath: string): Promise<string> {
  try {
    const content = await fs.readFile(skillMdPath, 'utf-8');
    const lines = content.split('\n');

    // Look for the first line after YAML front matter or header
    let foundHeader = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        foundHeader = true;
        continue;
      }
      if (foundHeader && trimmed.length > 0 && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
        return trimmed.slice(0, 200);
      }
    }
    return '';
  } catch {
    return '';
  }
}
