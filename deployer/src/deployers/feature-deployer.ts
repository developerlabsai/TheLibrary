/**
 * Feature spec deployer - copies feature specification directories
 * from the library into a target project's specs/ directory.
 */

import path from 'path';
import fs from 'fs-extra';
import { ensureDir, copyIfNotExists, exists, getLibraryRoot } from '../utils/file-ops.js';
import type { DeployOptions } from '../types.js';

/** Result of a feature deployment operation. */
interface FeatureDeployResult {
  deployed: string[];
  skipped: string[];
  warnings: string[];
}

/**
 * Deploys feature specification directories into a target project.
 *
 * For each feature name, looks for a matching directory under the project's
 * own specs/ or under a shared features library, then copies the directory
 * (spec.md, plan.md, tasks.md, data-model.md, contracts/, etc.) into the
 * target project's specs/ directory.
 *
 * @param features - Array of feature directory names to deploy.
 * @param options - Deploy options containing targetPath and flags.
 * @returns Summary of deployed, skipped, and warnings.
 */
export async function deployFeatureSpecs(
  features: string[],
  options: DeployOptions
): Promise<FeatureDeployResult> {
  const result: FeatureDeployResult = {
    deployed: [],
    skipped: [],
    warnings: [],
  };

  const targetSpecsDir = path.join(options.targetPath, 'specs');
  await ensureDir(targetSpecsDir);

  const libraryRoot = getLibraryRoot();
  const projectRoot = path.dirname(libraryRoot);

  // Source: look in the Agent Creator's own specs/ directory
  const sourceSpecsDir = path.join(projectRoot, 'specs');

  for (const featureName of features) {
    const sourcePath = path.join(sourceSpecsDir, featureName);
    const destPath = path.join(targetSpecsDir, featureName);

    // Check source exists
    if (!(await exists(sourcePath))) {
      result.warnings.push(`Feature "${featureName}" not found in ${sourceSpecsDir}`);
      continue;
    }

    // Check if destination already exists
    if (await exists(destPath)) {
      if (options.force) {
        await fs.copy(sourcePath, destPath, { overwrite: true });
        result.deployed.push(featureName);
      } else {
        result.skipped.push(featureName);
      }
      continue;
    }

    // Copy entire feature directory
    await fs.copy(sourcePath, destPath, { overwrite: false });
    result.deployed.push(featureName);
  }

  return result;
}
