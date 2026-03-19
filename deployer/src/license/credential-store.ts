/**
 * Credential store — manages ~/.speckit/credentials file.
 * Stores the license key and registry URL for CLI authentication.
 */

import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import type { CredentialFile } from '../types.js';

const DEFAULT_REGISTRY_URL = 'https://registry.speckit.dev/api/v1';
const CONFIG_DIR = path.join(os.homedir(), '.speckit');
const CREDENTIALS_PATH = path.join(CONFIG_DIR, 'credentials');

/**
 * Returns the speckit config directory (~/.speckit/), creating it if missing.
 */
export async function getConfigDir(): Promise<string> {
  await fs.ensureDir(CONFIG_DIR);
  return CONFIG_DIR;
}

/**
 * Returns the registry URL, checking env var override first.
 */
export function getRegistryUrl(credentials?: CredentialFile | null): string {
  return process.env.SPECKIT_REGISTRY_URL
    || credentials?.registry_url
    || DEFAULT_REGISTRY_URL;
}

/**
 * Reads credentials from ~/.speckit/credentials.
 * Returns null if the file does not exist.
 */
export async function getCredentials(): Promise<CredentialFile | null> {
  try {
    if (!(await fs.pathExists(CREDENTIALS_PATH))) return null;
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    return JSON.parse(content) as CredentialFile;
  } catch {
    return null;
  }
}

/**
 * Saves credentials to ~/.speckit/credentials with 0600 permissions.
 */
export async function saveCredentials(key: string, registryUrl?: string): Promise<void> {
  await getConfigDir();
  const data: CredentialFile = {
    key,
    registry_url: registryUrl || DEFAULT_REGISTRY_URL,
  };
  await fs.writeFile(CREDENTIALS_PATH, JSON.stringify(data, null, 2), { mode: 0o600 });
}

/**
 * Removes the credentials file.
 */
export async function deleteCredentials(): Promise<void> {
  try {
    await fs.remove(CREDENTIALS_PATH);
  } catch {
    // File may not exist — that's fine
  }
}
