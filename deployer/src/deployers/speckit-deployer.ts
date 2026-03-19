/**
 * Core SpecKit deployer - deploys the .specify/ directory structure
 * uniformly into any target project.
 */

import path from 'path';
import {
  ensureDir,
  copyDirMerge,
  copyIfNotExists,
  writeText,
  exists,
  getLibraryRoot,
} from '../utils/file-ops.js';
import type { ProjectProfile, DeployOptions } from '../types.js';

export interface SpeckitDeployResult {
  created: string[];
  skipped: string[];
  warnings: string[];
}

/**
 * Deploys the .specify/ directory structure into the target project.
 * If already present, merges (never overwrites constitution or user files).
 */
export async function deploySpeckit(
  profile: ProjectProfile,
  options: DeployOptions
): Promise<SpeckitDeployResult> {
  const result: SpeckitDeployResult = { created: [], skipped: [], warnings: [] };
  const targetPath = options.targetPath;
  const libraryRoot = getLibraryRoot();
  const specifyDir = path.join(targetPath, '.specify');

  if (options.dryRun) {
    result.created.push(
      '.specify/',
      '.specify/memory/',
      '.specify/scripts/bash/',
      '.specify/templates/',
      '.specify/references/',
      'specs/'
    );
    return result;
  }

  // 1. Create .specify directory structure
  await ensureDir(path.join(specifyDir, 'memory'));
  await ensureDir(path.join(specifyDir, 'scripts', 'bash'));
  await ensureDir(path.join(specifyDir, 'templates'));
  await ensureDir(path.join(specifyDir, 'references'));

  // 2. Create .current-feature file
  const currentFeatureCreated = await copyIfNotExists(
    '/dev/null', // Will be overwritten below
    path.join(specifyDir, '.current-feature')
  );
  if (currentFeatureCreated) {
    await writeText(path.join(specifyDir, '.current-feature'), '');
    result.created.push('.specify/.current-feature');
  } else {
    result.skipped.push('.specify/.current-feature');
  }

  // 3. Deploy scripts/bash/ (ALL scripts, uniform across projects)
  const scriptsSource = path.join(libraryRoot, 'speckit', 'scripts', 'bash');
  if (await exists(scriptsSource)) {
    const scriptsResult = await copyDirMerge(
      scriptsSource,
      path.join(specifyDir, 'scripts', 'bash')
    );
    result.created.push(...scriptsResult.copied.map((f) => path.relative(targetPath, f)));
    result.skipped.push(...scriptsResult.skipped.map((f) => path.relative(targetPath, f)));

    // Make scripts executable
    const { chmod } = await import('fs/promises');
    for (const script of scriptsResult.copied) {
      if (script.endsWith('.sh')) {
        await chmod(script, 0o755);
      }
    }
  } else {
    result.warnings.push('Library scripts not found at ' + scriptsSource);
  }

  // 4. Deploy templates/ (ALL templates, uniform across projects)
  const templatesSource = path.join(libraryRoot, 'speckit', 'templates');
  if (await exists(templatesSource)) {
    const templatesResult = await copyDirMerge(
      templatesSource,
      path.join(specifyDir, 'templates')
    );
    result.created.push(...templatesResult.copied.map((f) => path.relative(targetPath, f)));
    result.skipped.push(...templatesResult.skipped.map((f) => path.relative(targetPath, f)));
  } else {
    result.warnings.push('Library templates not found at ' + templatesSource);
  }

  // 5. Deploy references/
  const refsSource = path.join(libraryRoot, 'speckit', 'references');
  if (await exists(refsSource)) {
    const refsResult = await copyDirMerge(
      refsSource,
      path.join(specifyDir, 'references')
    );
    result.created.push(...refsResult.copied.map((f) => path.relative(targetPath, f)));
  }

  // 6. Create specs/ directory
  const specsDir = path.join(targetPath, 'specs');
  if (!(await exists(specsDir))) {
    await ensureDir(specsDir);
    result.created.push('specs/');
  } else {
    result.skipped.push('specs/ (already exists)');
  }

  return result;
}
