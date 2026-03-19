/**
 * Registry client — HTTP client for fetching assets from the SpecKit registry.
 * Used by deploy and list commands for premium asset operations.
 */

import chalk from 'chalk';
import { getCredentials, getRegistryUrl } from '../license/credential-store.js';
import type { AssetMetadata, CatalogEntry } from '../types.js';

/** Error response from registry API. */
interface RegistryErrorResponse {
  error: string;
  message: string;
  required_tier?: string;
  current_tier?: string;
  asset?: string;
}

/**
 * Fetches asset content archive from the registry.
 * Returns the buffer and version/checksum metadata.
 */
export async function fetchAsset(
  name: string,
  version?: string
): Promise<{ data: Buffer; version: string; checksum: string; tier: string }> {
  const credentials = await getCredentials();
  if (!credentials) {
    throw new RegistryClientError('auth_required', 'Not authenticated. Run `speckit login` first.');
  }

  const url = getRegistryUrl(credentials);
  let endpoint = `${url}/registry/assets/${encodeURIComponent(name)}`;
  if (version) {
    endpoint += `?version=${encodeURIComponent(version)}`;
  }

  const response = await fetch(endpoint, {
    headers: { 'X-License-Key': credentials.key },
  });

  if (!response.ok) {
    const errorBody = await response.json() as RegistryErrorResponse;
    throw new RegistryClientError(errorBody.error, formatErrorMessage(errorBody));
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    data: buffer,
    version: response.headers.get('X-Asset-Version') || 'unknown',
    checksum: response.headers.get('X-Asset-Checksum') || '',
    tier: response.headers.get('X-Asset-Tier') || 'unknown',
  };
}

/**
 * Fetches the asset catalog (filtered by entitlements).
 */
export async function fetchCatalog(type?: string): Promise<CatalogEntry[]> {
  const credentials = await getCredentials();
  if (!credentials) return [];

  const url = getRegistryUrl(credentials);
  let endpoint = `${url}/registry/catalog`;
  if (type) {
    endpoint += `?type=${encodeURIComponent(type)}`;
  }

  try {
    const response = await fetch(endpoint, {
      headers: { 'X-License-Key': credentials.key },
    });

    if (!response.ok) return [];

    const body = await response.json() as { data: CatalogEntry[] };
    return body.data || [];
  } catch {
    return [];
  }
}

/**
 * Fetches metadata for a specific asset.
 */
export async function fetchMetadata(name: string): Promise<AssetMetadata | null> {
  const credentials = await getCredentials();
  if (!credentials) return null;

  const url = getRegistryUrl(credentials);
  const endpoint = `${url}/registry/assets/${encodeURIComponent(name)}/metadata`;

  try {
    const response = await fetch(endpoint, {
      headers: { 'X-License-Key': credentials.key },
    });

    if (!response.ok) return null;
    return await response.json() as AssetMetadata;
  } catch {
    return null;
  }
}

/**
 * Formats error messages from the registry with chalk styling.
 */
function formatErrorMessage(error: RegistryErrorResponse): string {
  switch (error.error) {
    case 'auth_required':
      return `License key required. Run ${chalk.bold('speckit login')} to authenticate.`;
    case 'invalid_key':
      return 'License key is invalid.';
    case 'key_expired':
      return `License key has expired. Contact sales for renewal.`;
    case 'key_revoked':
      return `License key has been revoked. Contact sales.`;
    case 'tier_insufficient':
      return `This asset requires an ${capitalize(error.required_tier || 'Enterprise')} subscription. Your current tier is ${capitalize(error.current_tier || 'Free')}. Contact sales to upgrade.`;
    case 'not_entitled':
      return `Asset "${error.asset || 'unknown'}" is not included in your subscription. Contact sales to add it.`;
    case 'asset_not_found':
      return error.message;
    case 'version_not_found':
      return error.message;
    default:
      return error.message || 'Unknown registry error.';
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Typed error for registry client failures. */
export class RegistryClientError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string
  ) {
    super(userMessage);
    this.name = 'RegistryClientError';
  }
}
