/**
 * Admin authentication routes.
 * POST /admin/login — authenticate admin with email/password
 * POST /admin/logout — invalidate admin session
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { adminAuth } from '../middleware/admin-auth.js';
import type { ErrorResponse } from '../types.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/v1/admin/login
 * Authenticate admin with email and password via Supabase Auth.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error: ErrorResponse = { error: 'validation_error', message: 'Email and password are required.' };
    res.status(400).json(error);
    return;
  }

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !data.session) {
    const error: ErrorResponse = { error: 'invalid_credentials', message: 'Invalid email or password.' };
    res.status(401).json(error);
    return;
  }

  // Look up admin account
  const { data: admin, error: dbError } = await supabase
    .from('admin_accounts')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .single();

  if (dbError || !admin) {
    const error: ErrorResponse = { error: 'not_admin', message: 'No admin account associated with this email.' };
    res.status(403).json(error);
    return;
  }

  // Update last_login_at
  await supabase
    .from('admin_accounts')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', admin.id);

  res.json({
    token: data.session.access_token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      last_login_at: new Date().toISOString(),
    },
  });
});

/**
 * POST /api/v1/admin/logout
 * Invalidate the current admin session.
 */
router.post('/logout', adminAuth, async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Sign out via Supabase using the admin client
    await supabase.auth.admin.signOut(authHeader.slice(7));
  }
  res.json({ message: 'Logged out successfully.' });
});

export default router;
