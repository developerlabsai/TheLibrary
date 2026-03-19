/**
 * Audit log routes — query admin audit log per license-server.yaml.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { adminAuth } from '../middleware/admin-auth.js';
import type { ErrorResponse, AuditLogEntry } from '../types.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const router = Router();

/** GET /audit-log — query audit log with optional filters. */
router.get('/audit-log', adminAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    let query = supabase
      .from('admin_audit_log')
      .select('*, admin_accounts(username)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (req.query.admin_id) {
      query = query.eq('admin_id', req.query.admin_id as string);
    }
    if (req.query.action) {
      query = query.eq('action', req.query.action as string);
    }
    if (req.query.since) {
      query = query.gte('created_at', req.query.since as string);
    }

    const { data, error } = await query;
    if (error) {
      const errResponse: ErrorResponse = { error: 'internal_error', message: 'Failed to query audit log.' };
      res.status(500).json(errResponse);
      return;
    }

    const entries = (data || []).map((entry: AuditLogEntry & { admin_accounts?: { username: string } }) => ({
      id: entry.id,
      admin_id: entry.admin_id,
      admin_username: entry.admin_accounts?.username || 'unknown',
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      details: entry.details,
      created_at: entry.created_at,
    }));

    res.json({ data: entries });
  } catch {
    const error: ErrorResponse = { error: 'internal_error', message: 'Failed to query audit log.' };
    res.status(500).json(error);
  }
});

export default router;
