/**
 * Settings generator - creates or merges .claude/settings.local.json
 * for the target project. Adds SpecKit-related permissions without
 * removing any existing permissions.
 */

import path from 'path';
import type { ProjectProfile } from '../types.js';
import { readJson, writeJson, ensureDir, exists } from '../utils/file-ops.js';
import { mergeJson } from '../utils/file-ops.js';

interface ClaudeSettings {
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
  [key: string]: unknown;
}

/**
 * Generates or merges settings.local.json for the target project.
 */
export async function generateSettings(
  profile: ProjectProfile,
  targetPath: string,
  dryRun: boolean = false
): Promise<{ created: boolean; merged: boolean; warnings: string[] }> {
  const settingsPath = path.join(targetPath, '.claude', 'settings.local.json');
  const warnings: string[] = [];

  if (dryRun) {
    const existsAlready = await exists(settingsPath);
    return {
      created: !existsAlready,
      merged: existsAlready,
      warnings: [],
    };
  }

  await ensureDir(path.join(targetPath, '.claude'));

  const speckitPermissions = getSpeckitPermissions(targetPath);

  const existing = await readJson<ClaudeSettings>(settingsPath);

  if (existing) {
    // Merge: add new permissions, never remove existing
    const existingAllow = existing.permissions?.allow || [];
    const newPerms = speckitPermissions.filter((p) => !existingAllow.includes(p));

    if (newPerms.length > 0) {
      existing.permissions = existing.permissions || {};
      existing.permissions.allow = [...existingAllow, ...newPerms];
      await writeJson(settingsPath, existing);
      return { created: false, merged: true, warnings: [] };
    }

    return {
      created: false,
      merged: false,
      warnings: ['All SpecKit permissions already present'],
    };
  }

  // Create new settings file
  const settings: ClaudeSettings = {
    permissions: {
      allow: speckitPermissions,
    },
  };

  await writeJson(settingsPath, settings);
  return { created: true, merged: false, warnings: [] };
}

/**
 * Returns the standard SpecKit permissions for .claude/settings.local.json.
 */
function getSpeckitPermissions(targetPath: string): string[] {
  return [
    // SpecKit script permissions
    `Bash(.specify/scripts/bash/*.sh)`,
    // Git operations
    'Bash(git status:*)',
    'Bash(git diff:*)',
    'Bash(git log:*)',
    'Bash(git add:*)',
    'Bash(git commit:*)',
    // Build and lint
    'Bash(npm run build:*)',
    'Bash(npm run lint:*)',
    'Bash(npm run test:*)',
    'Bash(npx tsc --noEmit:*)',
    // Beads
    'Bash(bd:*)',
    // Read access
    `Read(${targetPath}/**)`,
  ];
}
