/**
 * Package registry - manages workforce package definitions.
 */

import path from 'path';
import { readJson, exists, getProjectRoot } from '../utils/file-ops.js';
import type { WorkforcePackage } from '../types.js';

/**
 * Gets a specific workforce package by name.
 */
export async function getPackage(name: string): Promise<WorkforcePackage | null> {
  const packagePath = path.join(getProjectRoot(), 'Packages', name, 'package.json');
  if (!(await exists(packagePath))) return null;
  return readJson<WorkforcePackage>(packagePath);
}

/**
 * Validates that all referenced assets in a package actually exist.
 */
export async function validatePackage(pkg: WorkforcePackage): Promise<string[]> {
  const errors: string[] = [];
  const projectRoot = getProjectRoot();

  // Validate agents exist
  for (const agent of pkg.agents) {
    const agentDir = path.join(projectRoot, 'Agents', agent);
    if (!(await exists(agentDir))) {
      errors.push(`Agent "${agent}" referenced in package but not found`);
    }
  }

  // Validate skills exist
  for (const skill of pkg.skills) {
    const found = await findSkillDir(projectRoot, skill);
    if (!found) {
      errors.push(`Skill "${skill}" referenced in package but not found`);
    }
  }

  // Validate templates exist
  for (const template of pkg.templates) {
    const templatePath = path.join(projectRoot, 'Templates', template);
    if (!(await exists(templatePath))) {
      errors.push(`Template "${template}" referenced in package but not found`);
    }
  }

  return errors;
}

async function findSkillDir(projectRoot: string, skillName: string): Promise<boolean> {
  const skillsDir = path.join(projectRoot, 'Skills');
  if (!(await exists(skillsDir))) return false;

  const { readdir } = await import('fs/promises');
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const normalized = skillName.toLowerCase().replace(/[-\s]/g, '');

  return entries.some((e) => {
    if (!e.isDirectory()) return false;
    const entryNormalized = e.name.toLowerCase().replace(/[-\s]/g, '');
    return entryNormalized === normalized ||
      entryNormalized.includes(normalized) ||
      normalized.includes(entryNormalized);
  });
}
