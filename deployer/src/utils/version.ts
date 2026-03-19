/**
 * Version comparison and stamping utilities.
 */

import type { VersionStamp, ConstitutionProfile } from '../types.js';
import { readJson, writeJson } from './file-ops.js';
import path from 'path';

const DEPLOYER_VERSION = '1.0.0';
const SPECKIT_VERSION = '1.0.0';
const BEADS_VERSION = '1.0.0';
const CONSTITUTION_VERSION = '3.5.0';
const MCP_INFRA_VERSION = '1.0.0';

/**
 * Creates a version stamp for a deployment.
 */
export function createVersionStamp(
  profile: ConstitutionProfile,
  skills: Record<string, string> = {},
  agents: Record<string, string> = {},
  templates: string[] = [],
  hasMcpInfra: boolean = false
): VersionStamp {
  return {
    speckitVersion: SPECKIT_VERSION,
    deployerVersion: DEPLOYER_VERSION,
    deployedAt: new Date().toISOString(),
    profile,
    components: {
      speckit: SPECKIT_VERSION,
      beads: BEADS_VERSION,
      constitution: CONSTITUTION_VERSION,
      ...(hasMcpInfra ? { mcpInfra: MCP_INFRA_VERSION } : {}),
      skills,
      agents,
      templates,
    },
  };
}

/**
 * Reads the version stamp from a deployed project.
 */
export async function readVersionStamp(targetPath: string): Promise<VersionStamp | null> {
  return readJson<VersionStamp>(path.join(targetPath, 'speckit-version.json'));
}

/**
 * Writes the version stamp to a deployed project.
 */
export async function writeVersionStamp(targetPath: string, stamp: VersionStamp): Promise<void> {
  await writeJson(path.join(targetPath, 'speckit-version.json'), stamp);
}

/**
 * Compares two version strings (semver).
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

export { DEPLOYER_VERSION, SPECKIT_VERSION, BEADS_VERSION, CONSTITUTION_VERSION, MCP_INFRA_VERSION };
