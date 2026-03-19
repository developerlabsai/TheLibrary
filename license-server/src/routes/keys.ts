/**
 * License keys routes — CRUD for license keys per license-server.yaml.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { adminAuth } from '../middleware/admin-auth.js';
import { createKey, revokeKey, updateEntitlements, listKeys, getKey } from '../services/key-service.js';
import { getOrganization } from '../services/org-service.js';
import type { ErrorResponse, Tier } from '../types.js';

const router = Router();

/** GET /keys — list keys with optional org_id/status filters. */
router.get('/keys', adminAuth, async (req: Request, res: Response) => {
  try {
    const keys = await listKeys({
      org_id: req.query.org_id as string | undefined,
      status: req.query.status as 'active' | 'expired' | 'revoked' | undefined,
    });
    res.json({ data: keys });
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to list keys.' };
    res.status(500).json(error);
  }
});

/** POST /keys — issue a new license key. */
router.post('/keys', adminAuth, async (req: Request, res: Response) => {
  const { org_id, tier, entitled_assets, expires_at } = req.body;

  if (!org_id || !tier || !entitled_assets) {
    const error: ErrorResponse = { error: 'validation_error', message: 'org_id, tier, and entitled_assets are required.' };
    res.status(400).json(error);
    return;
  }

  try {
    // Verify organization exists
    const org = await getOrganization(org_id);
    if (!org) {
      const error: ErrorResponse = { error: 'not_found', message: 'Organization not found.' };
      res.status(404).json(error);
      return;
    }

    const key = await createKey(
      org_id,
      tier as Tier,
      entitled_assets,
      expires_at || null,
      req.admin!.id,
      req.ip || null
    );
    res.status(201).json(key);
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to create key.' };
    res.status(500).json(error);
  }
});

/** GET /keys/:keyId — get key details. */
router.get('/keys/:keyId', adminAuth, async (req: Request<{ keyId: string }>, res: Response) => {
  try {
    const key = await getKey(req.params.keyId);
    if (!key) {
      const error: ErrorResponse = { error: 'not_found', message: 'Key not found.' };
      res.status(404).json(error);
      return;
    }
    res.json(key);
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to fetch key.' };
    res.status(500).json(error);
  }
});

/** POST /keys/:keyId/revoke — permanently revoke a key. */
router.post('/keys/:keyId/revoke', adminAuth, async (req: Request<{ keyId: string }>, res: Response) => {
  try {
    const existing = await getKey(req.params.keyId);
    if (!existing) {
      const error: ErrorResponse = { error: 'not_found', message: 'Key not found.' };
      res.status(404).json(error);
      return;
    }

    if (existing.status === 'revoked') {
      const error: ErrorResponse = { error: 'conflict', message: 'Key is already revoked.' };
      res.status(409).json(error);
      return;
    }

    const key = await revokeKey(
      req.params.keyId,
      req.admin!.id,
      req.body.reason,
      req.ip || null
    );
    res.json(key);
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to revoke key.' };
    res.status(500).json(error);
  }
});

/** PUT /keys/:keyId/entitlements — update entitled assets. */
router.put('/keys/:keyId/entitlements', adminAuth, async (req: Request<{ keyId: string }>, res: Response) => {
  const { entitled_assets } = req.body;

  if (!entitled_assets || !Array.isArray(entitled_assets)) {
    const error: ErrorResponse = { error: 'validation_error', message: 'entitled_assets array is required.' };
    res.status(400).json(error);
    return;
  }

  try {
    const existing = await getKey(req.params.keyId);
    if (!existing) {
      const error: ErrorResponse = { error: 'not_found', message: 'Key not found.' };
      res.status(404).json(error);
      return;
    }

    const key = await updateEntitlements(
      req.params.keyId,
      entitled_assets,
      req.admin!.id,
      req.ip || null
    );
    res.json(key);
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to update entitlements.' };
    res.status(500).json(error);
  }
});

export default router;
