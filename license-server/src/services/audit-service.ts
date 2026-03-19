/**
 * Audit service — logs admin actions to the admin_audit_log table.
 * All mutations to keys, orgs, and assets must call this service.
 */

import { createClient } from '@supabase/supabase-js';
import type { AuditAction } from '../types.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Logs an admin action to the audit log.
 */
export async function logAction(
  adminId: string,
  action: AuditAction,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown> | null,
  ipAddress: string | null
): Promise<void> {
  const { error } = await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    ip_address: ipAddress,
  });

  if (error) {
    console.error('Failed to log audit action:', error.message);
  }
}
