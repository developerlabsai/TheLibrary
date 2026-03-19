/**
 * Organizations routes — CRUD for organizations per license-server.yaml.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { adminAuth } from '../middleware/admin-auth.js';
import { getOrganization, createOrganization, updateOrganization, listOrganizations } from '../services/org-service.js';
import { listKeys } from '../services/key-service.js';
import type { ErrorResponse, Tier, BillingStatus } from '../types.js';

const router = Router();

/** GET /organizations — list with optional tier/status filters. */
router.get('/organizations', adminAuth, async (req: Request, res: Response) => {
  try {
    const orgs = await listOrganizations({
      tier: req.query.tier as Tier | undefined,
      status: req.query.status as BillingStatus | undefined,
    });
    res.json({ data: orgs });
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to list organizations.' };
    res.status(500).json(error);
  }
});

/** POST /organizations — create a new organization. */
router.post('/organizations', adminAuth, async (req: Request, res: Response) => {
  const { name, contact_email, tier } = req.body;

  if (!name || !contact_email || !tier) {
    const error: ErrorResponse = { error: 'validation_error', message: 'name, contact_email, and tier are required.' };
    res.status(400).json(error);
    return;
  }

  try {
    const org = await createOrganization(
      { name, contact_email, tier },
      req.admin!.id,
      req.ip || null
    );
    res.status(201).json(org);
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes('duplicate') || message.includes('unique')) {
      const error: ErrorResponse = { error: 'conflict', message: 'Organization name already exists.' };
      res.status(409).json(error);
    } else {
      const error: ErrorResponse = { error: 'internal_error', message: 'Failed to create organization.' };
      res.status(500).json(error);
    }
  }
});

/** GET /organizations/:orgId — detail with keys summary. */
router.get('/organizations/:orgId', adminAuth, async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const org = await getOrganization(req.params.orgId);
    if (!org) {
      const error: ErrorResponse = { error: 'not_found', message: 'Organization not found.' };
      res.status(404).json(error);
      return;
    }

    const keys = await listKeys({ org_id: org.id });
    const keySummaries = keys.map(k => ({
      id: k.id,
      key_prefix: k.key_prefix,
      tier: k.tier,
      status: k.status,
      deploy_count: k.deploy_count,
    }));

    res.json({ ...org, keys: keySummaries });
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to fetch organization.' };
    res.status(500).json(error);
  }
});

/** PATCH /organizations/:orgId — update organization. */
router.patch('/organizations/:orgId', adminAuth, async (req: Request<{ orgId: string }>, res: Response) => {
  const { name, contact_email, tier, billing_status } = req.body;

  try {
    const existing = await getOrganization(req.params.orgId);
    if (!existing) {
      const error: ErrorResponse = { error: 'not_found', message: 'Organization not found.' };
      res.status(404).json(error);
      return;
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (contact_email !== undefined) updates.contact_email = contact_email;
    if (tier !== undefined) updates.tier = tier;
    if (billing_status !== undefined) updates.billing_status = billing_status;

    const org = await updateOrganization(
      req.params.orgId,
      updates,
      req.admin!.id,
      req.ip || null
    );
    res.json(org);
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to update organization.' };
    res.status(500).json(error);
  }
});

export default router;
