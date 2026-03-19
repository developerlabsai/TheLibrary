/**
 * Audit command — scans a project for deployed SpecKit assets
 * and reports their license tier and status.
 */

import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { getCredentials } from '../license/credential-store.js';
import { fetchMetadata, RegistryClientError } from '../registry/registry-client.js';
import { validate, LicenseValidationError } from '../license/license-client.js';
import type { StubFile } from '../types.js';

interface AuditEntry {
  name: string;
  type: 'agent' | 'specialty' | 'template' | 'stub' | 'unknown';
  tier: string;
  status: string;
  version: string;
  source: 'local' | 'registry' | 'stub';
}

/**
 * Executes the audit command — scans target project for SpecKit assets.
 */
export async function executeAudit(targetPath: string, jsonOutput?: boolean): Promise<void> {
  const resolvedPath = path.resolve(targetPath);
  const entries: AuditEntry[] = [];

  if (!jsonOutput) {
    console.log(chalk.bold('\n  SpecKit Asset Audit\n'));
    console.log(chalk.dim(`  Target: ${resolvedPath}\n`));
  }

  // Scan speckit-version.json for deployed assets
  const versionFile = path.join(resolvedPath, 'speckit-version.json');
  if (await fs.pathExists(versionFile)) {
    try {
      const stamp = await fs.readJson(versionFile);
      const components = stamp.components || {};

      // Specialties
      if (components.specialties) {
        for (const [name, version] of Object.entries(components.specialties)) {
          entries.push({
            name,
            type: 'specialty',
            tier: 'free',
            status: 'deployed',
            version: version as string,
            source: 'local',
          });
        }
      }

      // Agents
      if (components.agents) {
        for (const [name, version] of Object.entries(components.agents)) {
          entries.push({
            name,
            type: 'agent',
            tier: 'free',
            status: 'deployed',
            version: version as string,
            source: 'local',
          });
        }
      }

      // Templates
      if (components.templates) {
        for (const tmpl of components.templates as string[]) {
          entries.push({
            name: tmpl,
            type: 'template',
            tier: 'free',
            status: 'deployed',
            version: stamp.speckitVersion || 'unknown',
            source: 'local',
          });
        }
      }
    } catch {
      // Malformed version file — skip
    }
  }

  // Scan for stub files
  const stubsDir = path.join(resolvedPath, '.speckit', 'stubs');
  if (await fs.pathExists(stubsDir)) {
    const stubFiles = await fs.readdir(stubsDir);
    for (const file of stubFiles) {
      if (!file.endsWith('.speckit-stub.json')) continue;
      try {
        const stub: StubFile = await fs.readJson(path.join(stubsDir, file));
        entries.push({
          name: stub.asset,
          type: 'stub',
          tier: 'enterprise',
          status: 'stub',
          version: stub.version,
          source: 'stub',
        });
      } catch {
        // Skip malformed stubs
      }
    }
  }

  // Check license status for registry assets
  const credentials = await getCredentials();
  let licenseValid = false;

  if (credentials) {
    try {
      const licenseStatus = await validate(credentials.key);
      licenseValid = licenseStatus.valid;

      // Enrich entries with registry metadata
      for (const entry of entries) {
        if (entry.source === 'stub') {
          try {
            const meta = await fetchMetadata(entry.name);
            if (meta) {
              entry.tier = meta.tier;
            }
            entry.status = licenseValid ? 'active (stub)' : 'expired (stub)';
          } catch (err) {
            if (err instanceof RegistryClientError) {
              if (err.code === 'key_revoked') {
                entry.status = 'revoked';
              } else if (err.code === 'key_expired') {
                entry.status = 'expired';
              } else {
                entry.status = 'status unknown';
              }
            } else {
              entry.status = 'status unknown — offline';
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof LicenseValidationError) {
        // License invalid — mark all stubs accordingly
        for (const entry of entries) {
          if (entry.source === 'stub') {
            entry.status = `${err.code}`;
          }
        }
      } else {
        // Offline
        for (const entry of entries) {
          if (entry.source === 'stub') {
            entry.status = 'status unknown — offline';
          }
        }
      }
    }
  } else {
    // No credentials — stubs can't be validated
    for (const entry of entries) {
      if (entry.source === 'stub') {
        entry.status = 'not authenticated';
      }
    }
  }

  // Output
  if (jsonOutput) {
    console.log(JSON.stringify({ assets: entries, total: entries.length }, null, 2));
    return;
  }

  if (entries.length === 0) {
    console.log(chalk.dim('  No SpecKit assets found in this project.\n'));
    return;
  }

  // Table header
  console.log(chalk.bold('  Name                     Type         Tier         Status'));
  console.log(chalk.dim('  ' + '-'.repeat(72)));

  for (const entry of entries) {
    const name = entry.name.padEnd(25);
    const type = entry.type.padEnd(13);
    const tier = entry.tier.padEnd(13);

    let statusStr: string;
    if (entry.status.includes('revoked')) {
      statusStr = chalk.red(entry.status);
    } else if (entry.status.includes('expired') || entry.status.includes('unknown')) {
      statusStr = chalk.yellow(entry.status);
    } else if (entry.status === 'not authenticated') {
      statusStr = chalk.yellow(entry.status);
    } else {
      statusStr = chalk.green(entry.status);
    }

    console.log(`  ${name} ${type} ${tier} ${statusStr}`);
  }

  console.log(chalk.dim(`\n  Total: ${entries.length} assets\n`));
}
