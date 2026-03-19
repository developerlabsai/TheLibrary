/**
 * Team registry - manages workforce team definitions.
 */

import path from 'path';
import { readJson, exists, getProjectRoot } from '../utils/file-ops.js';
import type { WorkforceTeam } from '../types.js';

/**
 * Gets a specific workforce team by name.
 */
export async function getTeam(name: string): Promise<WorkforceTeam | null> {
  const packagePath = path.join(getProjectRoot(), 'Teams', name, 'package.json');
  if (!(await exists(packagePath))) return null;
  return readJson<WorkforceTeam>(packagePath);
}

/**
 * Validates that all referenced assets in a team actually exist.
 */
export async function validateTeam(pkg: WorkforceTeam): Promise<string[]> {
  const errors: string[] = [];
  const projectRoot = getProjectRoot();

  // Validate agents exist
  for (const agent of pkg.agents) {
    const agentDir = path.join(projectRoot, 'Agents', agent);
    if (!(await exists(agentDir))) {
      errors.push(`Agent "${agent}" referenced in team but not found`);
    }
  }

  // Validate specialties exist
  for (const specialty of pkg.specialties) {
    const found = await findSpecialtyDir(projectRoot, specialty);
    if (!found) {
      errors.push(`Specialty "${specialty}" referenced in team but not found`);
    }
  }

  // Validate templates exist
  for (const template of pkg.templates) {
    const templatePath = path.join(projectRoot, 'Templates', template);
    if (!(await exists(templatePath))) {
      errors.push(`Template "${template}" referenced in team but not found`);
    }
  }

  return errors;
}

async function findSpecialtyDir(projectRoot: string, specialtyName: string): Promise<boolean> {
  const specialtiesDir = path.join(projectRoot, 'Specialties');
  if (!(await exists(specialtiesDir))) return false;

  const { readdir } = await import('fs/promises');
  const entries = await readdir(specialtiesDir, { withFileTypes: true });
  const normalized = specialtyName.toLowerCase().replace(/[-\s]/g, '');

  return entries.some((e) => {
    if (!e.isDirectory()) return false;
    const entryNormalized = e.name.toLowerCase().replace(/[-\s]/g, '');
    return entryNormalized === normalized ||
      entryNormalized.includes(normalized) ||
      normalized.includes(entryNormalized);
  });
}
