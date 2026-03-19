/**
 * Agent deployer - deploys agent definitions from the library into target projects.
 */

import path from 'path';
import fs from 'fs-extra';
import {
  ensureDir,
  exists,
  readJson,
  copyIfNotExists,
  getProjectRoot,
} from '../utils/file-ops.js';
import type { AgentManifest, DeployOptions } from '../types.js';

export interface AgentDeployResult {
  deployed: string[];
  skipped: string[];
  warnings: string[];
}

/**
 * Deploys specified agents into the target project.
 */
export async function deployAgents(
  agentNames: string[],
  options: DeployOptions
): Promise<AgentDeployResult> {
  const result: AgentDeployResult = { deployed: [], skipped: [], warnings: [] };
  const projectRoot = getProjectRoot();
  const agentsLibrary = path.join(projectRoot, 'Agents');
  const targetAgentsDir = path.join(options.targetPath, 'agents');

  if (options.dryRun) {
    result.deployed = agentNames.map((a) => `agents/${a}/`);
    return result;
  }

  await ensureDir(targetAgentsDir);

  for (const agentName of agentNames) {
    const srcDir = path.join(agentsLibrary, agentName);

    if (!(await exists(srcDir))) {
      result.warnings.push(`Agent "${agentName}" not found in library`);
      continue;
    }

    const manifest = await readJson<AgentManifest>(path.join(srcDir, 'manifest.json'));
    if (!manifest) {
      result.warnings.push(`Agent "${agentName}" has no manifest.json`);
      continue;
    }

    const destDir = path.join(targetAgentsDir, agentName);

    if (await exists(destDir)) {
      if (options.force) {
        await fs.remove(destDir);
      } else {
        result.skipped.push(`${agentName} (already exists)`);
        continue;
      }
    }

    // Copy all agent files
    await ensureDir(destDir);
    for (const [key, filename] of Object.entries(manifest.files)) {
      const srcFile = path.join(srcDir, filename);
      if (await exists(srcFile)) {
        await copyIfNotExists(srcFile, path.join(destDir, filename));
      }
    }

    // Copy manifest
    await fs.copy(
      path.join(srcDir, 'manifest.json'),
      path.join(destDir, 'manifest.json')
    );

    // Copy Context directory if it exists
    const contextDir = path.join(srcDir, 'Context');
    if (await exists(contextDir)) {
      await ensureDir(path.join(destDir, 'Context'));
    }

    result.deployed.push(agentName);
  }

  return result;
}

/**
 * Lists all available agents in the library.
 */
export async function listAvailableAgents(): Promise<AgentManifest[]> {
  const projectRoot = getProjectRoot();
  const agentsLibrary = path.join(projectRoot, 'Agents');

  if (!(await exists(agentsLibrary))) return [];

  const entries = await fs.readdir(agentsLibrary, { withFileTypes: true });
  const agents: AgentManifest[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const manifest = await readJson<AgentManifest>(
      path.join(agentsLibrary, entry.name, 'manifest.json')
    );
    if (manifest) {
      agents.push(manifest);
    }
  }

  return agents;
}
