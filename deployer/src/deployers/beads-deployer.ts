/**
 * Beads deployer - sets up the .beads/ directory for task tracking.
 */

import path from 'path';
import { ensureDir, copyIfNotExists, exists, writeJson, getLibraryRoot } from '../utils/file-ops.js';
import type { ProjectProfile, DeployOptions } from '../types.js';

export interface BeadsDeployResult {
  created: string[];
  skipped: string[];
  warnings: string[];
}

/**
 * Deploys the .beads/ directory into the target project.
 * If already present, skips entirely.
 */
export async function deployBeads(
  profile: ProjectProfile,
  options: DeployOptions
): Promise<BeadsDeployResult> {
  const result: BeadsDeployResult = { created: [], skipped: [], warnings: [] };
  const targetPath = options.targetPath;
  const beadsDir = path.join(targetPath, '.beads');

  if (profile.hasBeads) {
    result.skipped.push('.beads/ (already exists)');
    return result;
  }

  if (options.dryRun) {
    result.created.push('.beads/', '.beads/task-mapping.json');
    return result;
  }

  // Create .beads directory
  await ensureDir(beadsDir);
  result.created.push('.beads/');

  // Create empty task-mapping.json
  await writeJson(path.join(beadsDir, 'task-mapping.json'), {
    version: '1.0.0',
    mappings: {},
    lastSync: null,
  });
  result.created.push('.beads/task-mapping.json');

  // Check if 'bd' CLI is available
  try {
    const { execSync } = await import('child_process');
    execSync('which bd', { stdio: 'pipe' });
  } catch {
    result.warnings.push(
      'Beads CLI (bd) not found. Install it for full task sync functionality: npm install -g beads'
    );
  }

  return result;
}
