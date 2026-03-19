/**
 * Organization service — CRUD operations for organizations.
 */

import { createClient } from '@supabase/supabase-js';
import { logAction } from './audit-service.js';
import type { Organization, Tier, BillingStatus } from '../types.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Gets a single organization by ID.
 */
export async function getOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Organization;
}

/**
 * Creates a new organization.
 */
export async function createOrganization(
  data: { name: string; contact_email: string; tier: Tier },
  adminId: string,
  ipAddress: string | null
): Promise<Organization> {
  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      name: data.name,
      contact_email: data.contact_email,
      tier: data.tier,
      billing_status: 'active' as BillingStatus,
    })
    .select('*')
    .single();

  if (error || !org) {
    throw new Error(`Failed to create organization: ${error?.message}`);
  }

  await logAction(adminId, 'org.create', 'organization', org.id, {
    name: data.name,
    tier: data.tier,
  }, ipAddress);

  return org as Organization;
}

/**
 * Updates an existing organization.
 */
export async function updateOrganization(
  id: string,
  updates: Partial<Pick<Organization, 'name' | 'contact_email' | 'tier' | 'billing_status'>>,
  adminId: string,
  ipAddress: string | null
): Promise<Organization> {
  const { data: org, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !org) {
    throw new Error(`Failed to update organization: ${error?.message}`);
  }

  await logAction(adminId, 'org.update', 'organization', id, updates, ipAddress);

  return org as Organization;
}

/**
 * Lists organizations with optional filters.
 */
export async function listOrganizations(filters?: {
  tier?: Tier;
  status?: BillingStatus;
}): Promise<Organization[]> {
  let query = supabase.from('organizations').select('*').order('name');

  if (filters?.tier) {
    query = query.eq('tier', filters.tier);
  }
  if (filters?.status) {
    query = query.eq('billing_status', filters.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as Organization[];
}
