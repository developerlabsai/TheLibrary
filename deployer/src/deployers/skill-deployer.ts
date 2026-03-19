/**
 * Skill deployer - deploys skills from the library into target project's
 * .claude/skills/ directory.
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

export interface SkillDeployResult {
  deployed: string[];
  skipped: string[];
  warnings: string[];
}

/**
 * Deploys specified skills into the target project.
 */
export async function deploySkills(
  skillNames: string[],
  options: DeployOptions
): Promise<SkillDeployResult> {
  const result: SkillDeployResult = { deployed: [], skipped: [], warnings: [] };
  const projectRoot = getProjectRoot();
  const skillsLibrary = path.join(projectRoot, 'Skills');
  const targetSkillsDir = path.join(options.targetPath, '.claude', 'skills');

  if (options.dryRun) {
    result.deployed = skillNames.map((s) => `.claude/skills/${s}/`);
    return result;
  }

  await ensureDir(targetSkillsDir);

  // Map skill names to their directory names in the library
  const availableSkills = await getAvailableSkillDirs(skillsLibrary);

  for (const skillName of skillNames) {
    const normalizedName = normalizeSkillName(skillName);
    const matchedDir = availableSkills.find((dir) => {
      const normalizedDir = normalizeSkillName(dir);
      return normalizedDir === normalizedName ||
        normalizedDir.startsWith(normalizedName) ||
        normalizedName.startsWith(normalizedDir) ||
        normalizedDir.includes(normalizedName) ||
        normalizedName.includes(normalizedDir);
    });

    if (!matchedDir) {
      result.warnings.push(`Skill "${skillName}" not found in library`);
      continue;
    }

    const srcDir = path.join(skillsLibrary, matchedDir);
    const destDir = path.join(targetSkillsDir, normalizedName);

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
 * Lists all available skills in the library.
 */
export async function listAvailableSkills(): Promise<string[]> {
  const projectRoot = getProjectRoot();
  const skillsLibrary = path.join(projectRoot, 'Skills');

  if (!(await exists(skillsLibrary))) return [];

  return getAvailableSkillDirs(skillsLibrary);
}

async function getAvailableSkillDirs(skillsLibrary: string): Promise<string[]> {
  const entries = await fs.readdir(skillsLibrary, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);
}

/**
 * Normalizes a skill name to kebab-case for directory naming.
 */
function normalizeSkillName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
