/**
 * Health check route — canonical health endpoint for the license server.
 * GET /api/v1/health — returns server status.
 */

import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

export default router;
