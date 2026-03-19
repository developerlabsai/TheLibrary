/**
 * Shared types for the SpecKit License Server.
 * Derived from data-model.md.
 */

/** Subscription tier levels. */
export type Tier = 'free' | 'pro' | 'enterprise';

/** Organization billing status. */
export type BillingStatus = 'active' | 'suspended' | 'cancelled';

/** Deployable asset types. */
export type AssetType = 'agent' | 'skill' | 'template' | 'package';

/** Admin role levels. */
export type AdminRole = 'admin' | 'super_admin';

/** Audit log action types. */
export type AuditAction =
  | 'key.create'
  | 'key.revoke'
  | 'key.update_entitlements'
  | 'org.create'
  | 'org.update'
  | 'org.suspend'
  | 'asset.publish'
  | 'asset.update'
  | 'admin.create'
  | 'admin.delete';

/** Organization entity. */
export interface Organization {
  id: string;
  name: string;
  contact_email: string;
  billing_status: BillingStatus;
  tier: Tier;
  created_at: string;
  updated_at: string;
}

/** License key entity. */
export interface LicenseKey {
  id: string;
  key_value: string;
  org_id: string;
  tier: Tier;
  entitled_assets: string[];
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  last_used_at: string | null;
  deploy_count: number;
  created_at: string;
  created_by: string;
}

/** License key with computed status and org name (for API responses). */
export interface LicenseKeyWithStatus extends Omit<LicenseKey, 'key_value'> {
  key_prefix: string;
  org_name: string;
  status: 'active' | 'expired' | 'revoked';
}

/** Full license key returned only on creation. */
export interface LicenseKeyFull extends LicenseKeyWithStatus {
  key_value: string;
}

/** Admin account entity. */
export interface AdminAccount {
  id: string;
  auth_user_id: string;
  username: string;
  role: AdminRole;
  created_at: string;
  last_login_at: string | null;
}

/** Asset entity. */
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  tier: Tier;
  description: string | null;
  current_version: string;
  created_at: string;
  updated_at: string;
}

/** Asset version entity. */
export interface AssetVersion {
  id: string;
  asset_id: string;
  version: string;
  storage_path: string;
  checksum: string;
  file_manifest: string[];
  published_at: string;
  published_by: string;
}

/** Audit log entry entity. */
export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: AuditAction;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

/** License status returned by validation endpoint. */
export interface LicenseStatus {
  valid: boolean;
  org_name: string;
  tier: Tier;
  entitled_assets: string[];
  expires_at: string | null;
}

/** Error response format per OpenAPI contracts. */
export interface ErrorResponse {
  error: string;
  message: string;
  required_tier?: string;
  current_tier?: string;
  asset?: string;
}

/** Express request augmentation for admin auth middleware. */
declare global {
  namespace Express {
    interface Request {
      admin?: AdminAccount;
      licenseKey?: LicenseKey;
    }
  }
}
