/**
 * Registry routes — serves asset content to authenticated CLI clients.
 * Implements the registry-api.yaml contract.
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { licenseAuth } from '../middleware/license-auth.js';
import { getAsset, getAssetContent, getAssetVersions, listAssets } from '../services/asset-service.js';
import type { ErrorResponse, Tier } from '../types.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Tier hierarchy for comparison. */
const TIER_LEVEL: Record<Tier, number> = { free: 0, pro: 1, enterprise: 2 };

/**
 * GET /api/v1/registry/assets/:assetName
 * Serves asset content archive. Validates entitlements.
 * Increments deploy_count on the license key (FR-011).
 */
router.get('/registry/assets/:assetName', licenseAuth, async (req: import('express').Request<{ assetName: string }>, res: import('express').Response) => {
  const { assetName } = req.params;
  const version = req.query.version as string | undefined;
  const key = req.licenseKey!;

  // Look up asset
  const asset = await getAsset(assetName);
  if (!asset) {
    const error: ErrorResponse = {
      error: 'asset_not_found',
      message: `Asset "${assetName}" not found in the registry.`,
    };
    res.status(404).json(error);
    return;
  }

  // Check tier
  if (TIER_LEVEL[key.tier] < TIER_LEVEL[asset.tier]) {
    const error: ErrorResponse = {
      error: 'tier_insufficient',
      message: `This asset requires an ${capitalize(asset.tier)} subscription. Contact sales to upgrade.`,
      required_tier: asset.tier,
      current_tier: key.tier,
    };
    res.status(403).json(error);
    return;
  }

  // Check entitlement
  if (!key.entitled_assets.includes(assetName)) {
    const error: ErrorResponse = {
      error: 'not_entitled',
      message: 'This asset is not included in your subscription. Contact sales to add it.',
      asset: assetName,
    };
    res.status(403).json(error);
    return;
  }

  // Fetch content
  const content = await getAssetContent(assetName, version);
  if (!content) {
    if (version) {
      const error: ErrorResponse = {
        error: 'version_not_found',
        message: `Version ${version} not found for asset "${assetName}". Latest is ${asset.current_version}.`,
      };
      res.status(404).json(error);
    } else {
      const error: ErrorResponse = {
        error: 'asset_not_found',
        message: `Content not available for asset "${assetName}".`,
      };
      res.status(404).json(error);
    }
    return;
  }

  // Increment deploy_count (fire-and-forget)
  supabase
    .from('license_keys')
    .update({ deploy_count: key.deploy_count + 1 })
    .eq('id', key.id)
    .then();

  // Send content with metadata headers
  res.set('X-Asset-Version', content.version.version);
  res.set('X-Asset-Checksum', content.version.checksum);
  res.set('X-Asset-Tier', asset.tier);
  res.set('Content-Type', 'application/gzip');
  res.send(content.data);
});

/**
 * GET /api/v1/registry/assets/:assetName/metadata
 * Returns asset metadata without downloading content.
 */
router.get('/registry/assets/:assetName/metadata', licenseAuth, async (req: import('express').Request<{ assetName: string }>, res: import('express').Response) => {
  const { assetName } = req.params;

  const asset = await getAsset(assetName);
  if (!asset) {
    const error: ErrorResponse = {
      error: 'asset_not_found',
      message: `Asset "${assetName}" not found in the registry.`,
    };
    res.status(404).json(error);
    return;
  }

  const versions = await getAssetVersions(assetName);

  res.json({
    name: asset.name,
    type: asset.type,
    tier: asset.tier,
    description: asset.description,
    current_version: asset.current_version,
    available_versions: versions,
  });
});

/**
 * GET /api/v1/registry/catalog
 * Returns all assets accessible to the authenticated key.
 */
router.get('/registry/catalog', licenseAuth, async (req: import('express').Request, res: import('express').Response) => {
  const type = req.query.type as string | undefined;
  const key = req.licenseKey!;

  const allAssets = await listAssets(type ? { type } : undefined);

  const catalog = allAssets
    .filter(asset => TIER_LEVEL[key.tier] >= TIER_LEVEL[asset.tier])
    .map(asset => ({
      name: asset.name,
      type: asset.type,
      tier: asset.tier,
      description: asset.description,
      current_version: asset.current_version,
      entitled: key.entitled_assets.includes(asset.name),
    }));

  res.json({
    data: catalog,
    tier: key.tier,
    total: catalog.length,
  });
});

/**
 * GET /api/v1/registry/health
 * Registry health check (no auth required).
 */
router.get('/registry/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default router;
