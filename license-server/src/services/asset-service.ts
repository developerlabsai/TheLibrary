/**
 * Asset service — manages asset metadata and content retrieval from Supabase Storage.
 */

import { createClient } from '@supabase/supabase-js';
import type { Asset, AssetVersion } from '../types.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Gets an asset by name.
 */
export async function getAsset(name: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('name', name)
    .single();

  if (error || !data) return null;
  return data as Asset;
}

/**
 * Gets a specific version of an asset, or the latest if no version specified.
 */
export async function getAssetVersion(name: string, version?: string): Promise<AssetVersion | null> {
  const asset = await getAsset(name);
  if (!asset) return null;

  let query = supabase
    .from('asset_versions')
    .select('*')
    .eq('asset_id', asset.id);

  if (version) {
    query = query.eq('version', version);
  } else {
    query = query.eq('version', asset.current_version);
  }

  const { data, error } = await query.single();
  if (error || !data) return null;
  return data as AssetVersion;
}

/**
 * Downloads asset content archive from Supabase Storage.
 */
export async function getAssetContent(name: string, version?: string): Promise<{
  data: Buffer;
  version: AssetVersion;
} | null> {
  const assetVersion = await getAssetVersion(name, version);
  if (!assetVersion) return null;

  const { data, error } = await supabase.storage
    .from('asset-content')
    .download(assetVersion.storage_path);

  if (error || !data) return null;

  const buffer = Buffer.from(await data.arrayBuffer());
  return { data: buffer, version: assetVersion };
}

/**
 * Lists assets with optional filters.
 */
export async function listAssets(filters?: {
  type?: string;
  tier?: string;
}): Promise<Asset[]> {
  let query = supabase.from('assets').select('*').order('name');

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.tier) {
    query = query.eq('tier', filters.tier);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as Asset[];
}

/**
 * Gets all available versions for an asset.
 */
export async function getAssetVersions(name: string): Promise<string[]> {
  const asset = await getAsset(name);
  if (!asset) return [];

  const { data, error } = await supabase
    .from('asset_versions')
    .select('version')
    .eq('asset_id', asset.id)
    .order('published_at', { ascending: false });

  if (error || !data) return [];
  return data.map((v: { version: string }) => v.version);
}
