/**
 * Template deployer - deploys HTML templates and design system files
 * from the library into target projects.
 */

import path from 'path';
import fs from 'fs-extra';
import {
  ensureDir,
  copyIfNotExists,
  exists,
  getProjectRoot,
} from '../utils/file-ops.js';
import type { DeployOptions } from '../types.js';

export interface TemplateDeployResult {
  deployed: string[];
  skipped: string[];
  warnings: string[];
}

/**
 * Deploys specified templates into the target project.
 */
export async function deployTemplates(
  templateNames: string[],
  options: DeployOptions
): Promise<TemplateDeployResult> {
  const result: TemplateDeployResult = { deployed: [], skipped: [], warnings: [] };
  const projectRoot = getProjectRoot();
  const templatesLibrary = path.join(projectRoot, 'Templates');
  const targetTemplatesDir = path.join(options.targetPath, 'templates');

  if (options.dryRun) {
    result.deployed = templateNames.map((t) => `templates/${t}`);
    return result;
  }

  await ensureDir(targetTemplatesDir);

  // Get available templates
  const availableTemplates = await listAvailableTemplates();

  for (const templateName of templateNames) {
    const matched = availableTemplates.find(
      (t) => t.toLowerCase() === templateName.toLowerCase()
    );

    if (!matched) {
      result.warnings.push(`Template "${templateName}" not found in library`);
      continue;
    }

    const srcFile = path.join(templatesLibrary, matched);
    const destFile = path.join(targetTemplatesDir, matched);

    const copied = await copyIfNotExists(srcFile, destFile);
    if (copied) {
      result.deployed.push(matched);
    } else {
      result.skipped.push(`${matched} (already exists)`);
    }
  }

  return result;
}

/**
 * Lists all available templates in the library.
 */
export async function listAvailableTemplates(): Promise<string[]> {
  const projectRoot = getProjectRoot();
  const templatesLibrary = path.join(projectRoot, 'Templates');

  if (!(await exists(templatesLibrary))) return [];

  const entries = await fs.readdir(templatesLibrary, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && (e.name.endsWith('.html') || e.name.endsWith('.css')))
    .map((e) => e.name);
}
