/**
 * Specialty deployer - deploys specialties from the library into target project's
 * .claude/specialties/ directory.
 */

import path from 'path';
import fs from 'fs-extra';
import {
  ensureDir,
  copyDirMerge,
  exists,
  getProjectRoot,
} from '../utils/file-ops.js';
import type { DeployOptions } from '../types.js';

export interface SpecialtyDeployResult {
  deployed: string[];
  skipped: string[];
  warnings: string[];
}

/**
 * Deploys specified specialties into the target project.
 */
export async function deploySpecialties(
  specialtyNames: string[],
  options: DeployOptions
): Promise<SpecialtyDeployResult> {
  const result: SpecialtyDeployResult = { deployed: [], skipped: [], warnings: [] };
  const projectRoot = getProjectRoot();
  const specialtiesLibrary = path.join(projectRoot, 'Specialties');
  const targetSpecialtiesDir = path.join(options.targetPath, '.claude', 'specialties');

  if (options.dryRun) {
    result.deployed = specialtyNames.map((s) => `.claude/specialties/${s}/`);
    return result;
  }

  await ensureDir(targetSpecialtiesDir);

  // Map specialty names to their directory names in the library
  const availableSpecialties = await getAvailableSpecialtyDirs(specialtiesLibrary);

  for (const specialtyName of specialtyNames) {
    const normalizedName = normalizeSpecialtyName(specialtyName);
    const matchedDir = availableSpecialties.find((dir) => {
      const normalizedDir = normalizeSpecialtyName(dir);
      return normalizedDir === normalizedName ||
        normalizedDir.startsWith(normalizedName) ||
        normalizedName.startsWith(normalizedDir) ||
        normalizedDir.includes(normalizedName) ||
        normalizedName.includes(normalizedDir);
    });

    if (!matchedDir) {
      result.warnings.push(`Specialty "${specialtyName}" not found in library`);
      continue;
    }

    const srcDir = path.join(specialtiesLibrary, matchedDir);
    const destDir = path.join(targetSpecialtiesDir, normalizedName);

    if (await exists(destDir)) {
      if (options.force) {
        await fs.remove(destDir);
      } else {
        result.skipped.push(`${normalizedName} (already exists)`);
        continue;
      }
    }

    const copyResult = await copyDirMerge(srcDir, destDir);
    result.deployed.push(normalizedName);
  }

  return result;
}

/**
 * Lists all available specialties in the library.
 */
export async function listAvailableSpecialties(): Promise<string[]> {
  const projectRoot = getProjectRoot();
  const specialtiesLibrary = path.join(projectRoot, 'Specialties');

  if (!(await exists(specialtiesLibrary))) return [];

  return getAvailableSpecialtyDirs(specialtiesLibrary);
}

async function getAvailableSpecialtyDirs(specialtiesLibrary: string): Promise<string[]> {
  const entries = await fs.readdir(specialtiesLibrary, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);
}

/**
 * Normalizes a specialty name to kebab-case for directory naming.
 */
function normalizeSpecialtyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
