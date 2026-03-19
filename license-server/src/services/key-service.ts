/**
 * Key service — license key validation, issuance, and revocation.
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logAction } from './audit-service.js';
import type { LicenseKey, LicenseKeyFull, LicenseKeyWithStatus, LicenseStatus, Tier } from '../types.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Computes the status of a license key from its database fields.
 */
function computeStatus(key: LicenseKey): 'active' | 'expired' | 'revoked' {
  if (key.revoked_at) return 'revoked';
  if (key.expires_at && new Date(key.expires_at) < new Date()) return 'expired';
  return 'active';
}

/**
 * Validates a license key and returns its status.
 * Also updates last_used_at timestamp.
 */
export async function validateKey(keyValue: string): Promise<LicenseStatus | null> {
  const { data: key, error } = await supabase
    .from('license_keys')
    .select('*, organizations(name)')
    .eq('key_value', keyValue)
    .single();

  if (error || !key) return null;

  // Update last_used_at
  await supabase
    .from('license_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', key.id);

  const status = computeStatus(key as LicenseKey);
  const orgName = key.organizations?.name || 'Unknown';

  return {
    valid: status === 'active',
    org_name: orgName,
    tier: key.tier as Tier,
    entitled_assets: key.entitled_assets || [],
    expires_at: key.expires_at,
  };
}

/**
 * Creates a new license key for an organization.
 * Returns the full key value (only time it's shown).
 */
export async function createKey(
  orgId: string,
  tier: Tier,
  entitledAssets: string[],
  expiresAt: string | null,
  createdBy: string,
  ipAddress: string | null
): Promise<LicenseKeyFull> {
  const keyValue = `sk_live_${crypto.randomBytes(16).toString('hex')}`;

  const { data: key, error } = await supabase
    .from('license_keys')
    .insert({
      key_value: keyValue,
      org_id: orgId,
      tier,
      entitled_assets: entitledAssets,
      expires_at: expiresAt,
      created_by: createdBy,
    })
    .select('*, organizations(name)')
    .single();

  if (error || !key) {
    throw new Error(`Failed to create key: ${error?.message}`);
  }

  await logAction(createdBy, 'key.create', 'license_key', key.id, {
    org_id: orgId,
    tier,
    entitled_assets: entitledAssets,
  }, ipAddress);

  return {
    id: key.id,
    key_value: keyValue,
    key_prefix: keyValue.slice(0, 12),
    org_id: key.org_id,
    org_name: key.organizations?.name || 'Unknown',
    tier: key.tier,
    entitled_assets: key.entitled_assets,
    expires_at: key.expires_at,
    revoked_at: null,
    revoked_by: null,
    last_used_at: null,
    deploy_count: 0,
    created_at: key.created_at,
    created_by: key.created_by,
    status: 'active',
  };
}

/**
 * Revokes a license key permanently.
 */
export async function revokeKey(
  keyId: string,
  adminId: string,
  reason: string | undefined,
  ipAddress: string | null
): Promise<LicenseKeyWithStatus> {
  const { data: key, error } = await supabase
    .from('license_keys')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: adminId,
    })
    .eq('id', keyId)
    .select('*, organizations(name)')
    .single();

  if (error || !key) {
    throw new Error(`Failed to revoke key: ${error?.message}`);
  }

  await logAction(adminId, 'key.revoke', 'license_key', keyId, {
    reason: reason || 'No reason provided',
  }, ipAddress);

  return toKeyWithStatus(key as LicenseKey & { organizations: { name: string } });
}

/**
 * Updates the entitled_assets array for a key.
 */
export async function updateEntitlements(
  keyId: string,
  entitledAssets: string[],
  adminId: string,
  ipAddress: string | null
): Promise<LicenseKeyWithStatus> {
  const { data: key, error } = await supabase
    .from('license_keys')
    .update({ entitled_assets: entitledAssets })
    .eq('id', keyId)
    .select('*, organizations(name)')
    .single();

  if (error || !key) {
    throw new Error(`Failed to update entitlements: ${error?.message}`);
  }

  await logAction(adminId, 'key.update_entitlements', 'license_key', keyId, {
    entitled_assets: entitledAssets,
  }, ipAddress);

  return toKeyWithStatus(key as LicenseKey & { organizations: { name: string } });
}

/**
 * Lists license keys with optional filters.
 */
export async function listKeys(filters: {
  org_id?: string;
  status?: 'active' | 'expired' | 'revoked';
}): Promise<LicenseKeyWithStatus[]> {
  let query = supabase
    .from('license_keys')
    .select('*, organizations(name)')
    .order('created_at', { ascending: false });

  if (filters.org_id) {
    query = query.eq('org_id', filters.org_id);
  }

  const { data: keys, error } = await query;
  if (error || !keys) return [];

  let result = keys.map((k: LicenseKey & { organizations: { name: string } }) => toKeyWithStatus(k));

  if (filters.status) {
    result = result.filter(k => k.status === filters.status);
  }

  return result;
}

/**
 * Gets a single key by ID.
 */
export async function getKey(keyId: string): Promise<LicenseKeyWithStatus | null> {
  const { data: key, error } = await supabase
    .from('license_keys')
    .select('*, organizations(name)')
    .eq('id', keyId)
    .single();

  if (error || !key) return null;
  return toKeyWithStatus(key as LicenseKey & { organizations: { name: string } });
}

/** Converts a raw key row to a status-enriched response object. */
function toKeyWithStatus(key: LicenseKey & { organizations: { name: string } }): LicenseKeyWithStatus {
  return {
    id: key.id,
    key_prefix: key.key_value.slice(0, 12),
    org_id: key.org_id,
    org_name: key.organizations?.name || 'Unknown',
    tier: key.tier,
    entitled_assets: key.entitled_assets,
    expires_at: key.expires_at,
    revoked_at: key.revoked_at,
    revoked_by: key.revoked_by,
    last_used_at: key.last_used_at,
    deploy_count: key.deploy_count,
    created_at: key.created_at,
    created_by: key.created_by,
    status: computeStatus(key),
  };
}
