/**
 * Stub cache — local file cache for resolved stub content.
 * Stores asset content in ~/.speckit/cache/{asset_name}/{version}/ with TTL metadata.
 */

import path from 'path';
import fs from 'fs-extra';
import { getConfigDir } from '../license/credential-store.js';
import type { CacheResult } from '../types.js';

interface CacheMeta {
  version: string;
  checksum: string;
  cached_at: string;
  ttl: number;
  expires_at: string;
}

/**
 * Returns the cache directory for an asset.
 */
async function getCacheDir(assetName: string, version: string): Promise<string> {
  const configDir = await getConfigDir();
  return path.join(configDir, 'cache', assetName, version);
}

/**
 * Gets cached content for an asset if it exists and hasn't expired.
 */
export async function getCachedContent(
  assetName: string,
  version: string
): Promise<CacheResult | null> {
  const cacheDir = await getCacheDir(assetName, version);
  const metaPath = path.join(cacheDir, '.cache-meta.json');

  if (!(await fs.pathExists(metaPath))) return null;

  try {
    const meta: CacheMeta = await fs.readJson(metaPath);

    // Check expiry
    if (new Date(meta.expires_at) < new Date()) {
      return null;
    }

    // Read all cached files (excluding meta)
    const entries = await fs.readdir(cacheDir);
    const files: Record<string, Buffer> = {};

    for (const entry of entries) {
      if (entry === '.cache-meta.json') continue;
      const filePath = path.join(cacheDir, entry);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        files[entry] = await fs.readFile(filePath);
      }
    }

    return {
      files,
      version: meta.version,
      checksum: meta.checksum,
      from_cache: true,
    };
  } catch {
    return null;
  }
}

/**
 * Writes content to the cache with TTL metadata.
 */
export async function writeCacheContent(
  assetName: string,
  version: string,
  content: Buffer,
  checksum: string,
  ttl: number
): Promise<void> {
  const cacheDir = await getCacheDir(assetName, version);
  await fs.ensureDir(cacheDir);

  // Write content archive
  await fs.writeFile(path.join(cacheDir, 'content.tar.gz'), content);

  // Write cache metadata
  const now = new Date();
  const meta: CacheMeta = {
    version,
    checksum,
    cached_at: now.toISOString(),
    ttl,
    expires_at: new Date(now.getTime() + ttl * 1000).toISOString(),
  };

  await fs.writeJson(path.join(cacheDir, '.cache-meta.json'), meta, { spaces: 2 });
}

/**
 * Clears cache for a specific asset or all assets.
 */
export async function clearCache(assetName?: string): Promise<void> {
  const configDir = await getConfigDir();
  const baseCacheDir = path.join(configDir, 'cache');

  if (assetName) {
    const assetCacheDir = path.join(baseCacheDir, assetName);
    if (await fs.pathExists(assetCacheDir)) {
      await fs.remove(assetCacheDir);
    }
  } else {
    if (await fs.pathExists(baseCacheDir)) {
      await fs.remove(baseCacheDir);
    }
  }
}
