/**
 * Stub resolver — resolves stub files by fetching content from the registry
 * with caching and TTL-based expiry.
 */

import fs from 'fs-extra';
import chalk from 'chalk';
import { getCredentials } from '../license/credential-store.js';
import { fetchAsset, RegistryClientError } from '../registry/registry-client.js';
import { getCachedContent, writeCacheContent } from './stub-cache.js';
import type { StubFile, CacheResult } from '../types.js';

/** Result of resolving a stub. */
export interface ResolvedContent {
  success: boolean;
  files?: Record<string, Buffer>;
  version?: string;
  checksum?: string;
  from_cache?: boolean;
  error?: string;
}

/**
 * Resolves a stub file by fetching content from the registry or cache.
 */
export async function resolveStub(stubPath: string): Promise<ResolvedContent> {
  // Read and parse stub file
  let stub: StubFile;
  try {
    const content = await fs.readFile(stubPath, 'utf-8');
    stub = JSON.parse(content) as StubFile;
  } catch {
    return { success: false, error: 'Invalid or unreadable stub file.' };
  }

  if (!stub.speckit_stub) {
    return { success: false, error: 'File is not a SpecKit stub.' };
  }

  const { asset, version, ttl } = stub;

  // Try cache first
  const cached = await getCachedContent(asset, version || 'latest');
  if (cached) {
    return {
      success: true,
      files: cached.files,
      version: cached.version,
      checksum: cached.checksum,
      from_cache: true,
    };
  }

  // Cache miss or expired — need to fetch from registry
  const credentials = await getCredentials();
  if (!credentials) {
    return {
      success: false,
      error: `License credentials not found. Run ${chalk.bold('speckit login')} to authenticate.`,
    };
  }

  try {
    const result = await fetchAsset(asset, version || undefined);

    // Write to cache
    await writeCacheContent(
      asset,
      result.version,
      result.data,
      result.checksum,
      ttl || 86400
    );

    return {
      success: true,
      files: { 'content.tar.gz': result.data },
      version: result.version,
      checksum: result.checksum,
      from_cache: false,
    };
  } catch (err) {
    if (err instanceof RegistryClientError) {
      if (err.code === 'key_revoked' || err.code === 'key_expired') {
        return {
          success: false,
          error: `License no longer active: ${err.userMessage}`,
        };
      }
      return { success: false, error: err.userMessage };
    }

    // Offline — check if we have expired cache we can serve
    const expiredCache = await getCachedContent(asset, version || 'latest');
    if (expiredCache) {
      return {
        success: true,
        files: expiredCache.files,
        version: expiredCache.version,
        checksum: expiredCache.checksum,
        from_cache: true,
      };
    }

    return {
      success: false,
      error: 'Unable to reach the registry and no cached content available. Check your network connection.',
    };
  }
}
