/**
 * SpecKit License Server — Express entry point.
 * Hosts both the admin API (license-server.yaml) and the registry API (registry-api.yaml).
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { ErrorResponse } from './types.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3848', 10);

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${_res.statusCode} ${duration}ms`);
  });
  next();
});

// ── Routes ───────────────────────────────────────────────────────────
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import validateRouter from './routes/validate.js';
import registryRouter from './routes/registry.js';
import organizationsRouter from './routes/organizations.js';
import keysRouter from './routes/keys.js';
import auditRouter from './routes/audit.js';
import assetsAdminRouter from './routes/assets-admin.js';

app.use('/api/v1', healthRouter);
app.use('/api/v1/admin', authRouter);
app.use('/api/v1', validateRouter);
app.use('/api/v1', registryRouter);
app.use('/api/v1', organizationsRouter);
app.use('/api/v1', keysRouter);
app.use('/api/v1', auditRouter);
app.use('/api/v1', assetsAdminRouter);

// ── Error handling ───────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  const response: ErrorResponse = {
    error: 'internal_error',
    message: process.env.NODE_ENV === 'production'
      ? 'An internal error occurred'
      : err.message,
  };
  res.status(500).json(response);
});

// ── Start ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SpecKit License Server running on port ${PORT}`);
});

export default app;
