/**
 * License key authentication middleware.
 * Validates the X-License-Key header against the database.
 * Updates last_used_at on each valid request.
 */

import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import type { LicenseKey, ErrorResponse } from '../types.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Express middleware that extracts license key from X-License-Key header,
 * validates it, and attaches the key record to req.licenseKey.
 */
export async function licenseAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const keyValue = req.headers['x-license-key'] as string | undefined;

  if (!keyValue) {
    const error: ErrorResponse = {
      error: 'auth_required',
      message: 'License key required. Run `speckit login` to authenticate.',
    };
    res.status(401).json(error);
    return;
  }

  try {
    const { data: key, error: dbError } = await supabase
      .from('license_keys')
      .select('*')
      .eq('key_value', keyValue)
      .single();

    if (dbError || !key) {
      const error: ErrorResponse = { error: 'invalid_key', message: 'License key is invalid.' };
      res.status(401).json(error);
      return;
    }

    const licenseKey = key as LicenseKey;

    // Check if revoked
    if (licenseKey.revoked_at) {
      const error: ErrorResponse = { error: 'key_revoked', message: 'License key has been revoked. Contact sales.' };
      res.status(401).json(error);
      return;
    }

    // Check if expired
    if (licenseKey.expires_at && new Date(licenseKey.expires_at) < new Date()) {
      const error: ErrorResponse = {
        error: 'key_expired',
        message: 'License key has expired. Contact sales for renewal.',
      };
      res.status(401).json(error);
      return;
    }

    // Update last_used_at (fire-and-forget, don't block request)
    supabase
      .from('license_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', licenseKey.id)
      .then();

    req.licenseKey = licenseKey;
    next();
  } catch (err) {
    const error: ErrorResponse = { error: 'auth_error', message: 'License key validation failed.' };
    res.status(500).json(error);
  }
}
