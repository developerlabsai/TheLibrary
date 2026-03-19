/**
 * Admin authentication middleware.
 * Validates Bearer token via Supabase Auth and attaches the admin record to the request.
 */

import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import type { AdminAccount, ErrorResponse } from '../types.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Express middleware that extracts Bearer token from Authorization header,
 * validates via Supabase Auth, and attaches the admin record to req.admin.
 */
export async function adminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error: ErrorResponse = { error: 'auth_required', message: 'Admin authentication required.' };
    res.status(401).json(error);
    return;
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      const error: ErrorResponse = { error: 'invalid_token', message: 'Invalid or expired session token.' };
      res.status(401).json(error);
      return;
    }

    // Look up admin account by Supabase Auth user ID
    const { data: admin, error: dbError } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (dbError || !admin) {
      const error: ErrorResponse = { error: 'not_admin', message: 'No admin account associated with this user.' };
      res.status(403).json(error);
      return;
    }

    req.admin = admin as AdminAccount;
    next();
  } catch (err) {
    const error: ErrorResponse = { error: 'auth_error', message: 'Authentication failed.' };
    res.status(500).json(error);
  }
}
