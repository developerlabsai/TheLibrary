/**
 * License validation route — CLI-facing endpoint.
 * POST /api/v1/validate — validates a license key and returns its status.
 */

import { Router } from 'express';
import { validateKey } from '../services/key-service.js';
import type { ErrorResponse } from '../types.js';

const router = Router();

/**
 * POST /api/v1/validate
 * Accepts { key: string } and returns LicenseStatus or error.
 */
router.post('/validate', async (req, res) => {
  const { key } = req.body;

  if (!key || typeof key !== 'string') {
    const error: ErrorResponse = { error: 'validation_error', message: 'License key is required.' };
    res.status(400).json(error);
    return;
  }

  const status = await validateKey(key);

  if (!status) {
    const error: ErrorResponse = { error: 'invalid_key', message: 'License key is invalid.' };
    res.status(401).json(error);
    return;
  }

  if (!status.valid) {
    // Determine specific error code
    // We need to check the raw key to distinguish expired vs revoked
    // Since validateKey returns valid=false for both, check the fields
    if (status.expires_at && new Date(status.expires_at) < new Date()) {
      const error: ErrorResponse = {
        error: 'key_expired',
        message: 'License key has expired. Contact sales for renewal.',
      };
      res.status(401).json(error);
      return;
    }

    // If not expired but invalid, it's revoked
    const error: ErrorResponse = {
      error: 'key_revoked',
      message: 'License key has been revoked. Contact sales.',
    };
    res.status(401).json(error);
    return;
  }

  res.json(status);
});

export default router;
