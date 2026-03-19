/**
 * Assets admin routes — manage asset registration and version publishing.
 * Per license-server.yaml admin API.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { adminAuth } from '../middleware/admin-auth.js';
import { listAssets, getAsset } from '../services/asset-service.js';
import { logAction } from '../services/audit-service.js';
import type { ErrorResponse, Asset, AssetType, Tier } from '../types.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

/** GET /assets — list assets with optional type/tier filters. */
router.get('/assets', adminAuth, async (req: Request, res: Response) => {
  try {
    const assets = await listAssets({
      type: req.query.type as string | undefined,
      tier: req.query.tier as string | undefined,
    });
    res.json({ data: assets });
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to list assets.' };
    res.status(500).json(error);
  }
});

/** POST /assets — register a new asset. */
router.post('/assets', adminAuth, async (req: Request, res: Response) => {
  const { name, type, tier, description } = req.body;

  if (!name || !type || !tier || !description) {
    const error: ErrorResponse = { error: 'validation_error', message: 'name, type, tier, and description are required.' };
    res.status(400).json(error);
    return;
  }

  // Validate asset name pattern
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name) && !/^[a-z0-9]$/.test(name)) {
    const error: ErrorResponse = { error: 'validation_error', message: 'Asset name must match pattern: lowercase letters, numbers, and hyphens.' };
    res.status(400).json(error);
    return;
  }

  try {
    const { data: asset, error: dbError } = await supabase
      .from('assets')
      .insert({
        name,
        type: type as AssetType,
        tier: tier as Tier,
        description,
        current_version: '0.0.0',
      })
      .select('*')
      .single();

    if (dbError) {
      if (dbError.message.includes('duplicate') || dbError.message.includes('unique')) {
        const error: ErrorResponse = { error: 'conflict', message: 'Asset name already exists.' };
        res.status(409).json(error);
        return;
      }
      throw dbError;
    }

    await logAction(req.admin!.id, 'asset.publish', 'asset', asset.id, {
      name, type, tier,
    }, req.ip || null);

    res.status(201).json(asset as Asset);
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to register asset.' };
    res.status(500).json(error);
  }
});

/** POST /assets/:assetName/versions — publish a new version via multipart upload. */
router.post('/assets/:assetName/versions', adminAuth, upload.single('content'), async (req: Request<{ assetName: string }>, res: Response) => {
  const { assetName } = req.params;
  const version = req.body.version;

  if (!version) {
    const error: ErrorResponse = { error: 'validation_error', message: 'version is required.' };
    res.status(400).json(error);
    return;
  }

  if (!req.file) {
    const error: ErrorResponse = { error: 'validation_error', message: 'content file is required (tar.gz archive).' };
    res.status(400).json(error);
    return;
  }

  try {
    const asset = await getAsset(assetName);
    if (!asset) {
      const error: ErrorResponse = { error: 'not_found', message: 'Asset not found.' };
      res.status(404).json(error);
      return;
    }

    // Check for duplicate version
    const { data: existing } = await supabase
      .from('asset_versions')
      .select('id')
      .eq('asset_id', asset.id)
      .eq('version', version)
      .single();

    if (existing) {
      const error: ErrorResponse = { error: 'conflict', message: `Version ${version} already exists for asset ${assetName}.` };
      res.status(409).json(error);
      return;
    }

    // Upload to Supabase Storage
    const storagePath = `${assetName}/${version}.tar.gz`;
    const checksum = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    const { error: uploadError } = await supabase.storage
      .from('asset-content')
      .upload(storagePath, req.file.buffer, {
        contentType: 'application/gzip',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Create asset_version record
    const { data: assetVersion, error: versionError } = await supabase
      .from('asset_versions')
      .insert({
        asset_id: asset.id,
        version,
        storage_path: storagePath,
        checksum,
        file_manifest: [],
        published_by: req.admin!.id,
      })
      .select('*')
      .single();

    if (versionError) {
      throw versionError;
    }

    // Update current_version on the asset
    await supabase
      .from('assets')
      .update({ current_version: version })
      .eq('id', asset.id);

    await logAction(req.admin!.id, 'asset.update', 'asset', asset.id, {
      version, checksum, asset_name: assetName,
    }, req.ip || null);

    res.status(201).json({
      id: assetVersion.id,
      asset_id: assetVersion.asset_id,
      version: assetVersion.version,
      checksum: assetVersion.checksum,
      published_at: assetVersion.published_at,
    });
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to publish version.' };
    res.status(500).json(error);
  }
});

export default router;
