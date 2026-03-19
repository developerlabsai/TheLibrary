/**
 * Asset registry - central catalog of all available agents, specialties,
 * MCP servers, and templates in TheLibrary.
 */

import path from 'path';
import fs from 'fs-extra';
import { getProjectRoot, readJson, exists } from '../utils/file-ops.js';
import type { AgentManifest, SpecialtyInfo, WorkforceTeam, CatalogEntry } from '../types.js';
import { getCredentials } from '../license/credential-store.js';
import { fetchCatalog } from './registry-client.js';

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
 * Scans the library and returns all available specialties.
 */
export async function getAllSpecialties(): Promise<SpecialtyInfo[]> {
  const specialtiesDir = path.join(getProjectRoot(), 'Specialties');
  if (!(await exists(specialtiesDir))) return [];

  const entries = await fs.readdir(specialtiesDir, { withFileTypes: true });
  const specialties: SpecialtyInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const specialtyMdPath = path.join(specialtiesDir, entry.name, 'SPECIALTY.md');
    const hasSpecialtyMd = await exists(specialtyMdPath);
    const hasReference = await exists(path.join(specialtiesDir, entry.name, 'reference'));

    specialties.push({
      name: entry.name.toLowerCase().replace(/\s+/g, '-'),
      displayName: entry.name,
      version: '1.0.0',
      description: hasSpecialtyMd ? await extractSpecialtyDescription(specialtyMdPath) : '',
      directory: entry.name,
      hasReference,
      requiredMcp: [],
    });
  }

  return specialties;
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
 * Scans the Teams directory and returns all workforce teams.
 */
export async function getAllTeams(): Promise<WorkforceTeam[]> {
  const teamsDir = path.join(getProjectRoot(), 'Teams');
  if (!(await exists(teamsDir))) return [];

  const entries = await fs.readdir(teamsDir, { withFileTypes: true });
  const teams: WorkforceTeam[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const pkg = await readJson<WorkforceTeam>(
      path.join(teamsDir, entry.name, 'package.json')
    );
    if (pkg) teams.push(pkg);
  }

  return teams;
}

/**
 * Gets remote assets from the registry catalog when credentials are present.
 * Returns catalog entries merged with local assets, marked with source.
 */
export async function getRemoteCatalog(type?: string): Promise<CatalogEntry[]> {
  const credentials = await getCredentials();
  if (!credentials) return [];

  try {
    return await fetchCatalog(type);
  } catch {
    return [];
  }
}

/**
 * Extracts the description from a SPECIALTY.md file (first non-empty paragraph).
 */
async function extractSpecialtyDescription(specialtyMdPath: string): Promise<string> {
  try {
    const content = await fs.readFile(specialtyMdPath, 'utf-8');
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
