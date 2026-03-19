/**
 * Entitlement checker — determines if a deploy is allowed for a given asset.
 * Reads credentials, checks against the registry metadata endpoint.
 */

import chalk from 'chalk';
import { getCredentials, getRegistryUrl } from './credential-store.js';
import { validate, LicenseValidationError } from './license-client.js';
import type { EntitlementCheckResult, LicenseTier } from '../types.js';

/** Tier hierarchy for comparison. */
const TIER_LEVEL: Record<LicenseTier, number> = { free: 0, pro: 1, enterprise: 2 };

/**
 * Checks whether the current user is entitled to deploy a specific asset.
 */
export async function checkEntitlement(
  assetName: string,
  assetTier: LicenseTier
): Promise<EntitlementCheckResult> {
  // Free assets always allowed
  if (assetTier === 'free') {
    return { allowed: true, message: '' };
  }

  // Check credentials
  const credentials = await getCredentials();
  if (!credentials) {
    return {
      allowed: false,
      reason: 'no_credentials',
      message: `This asset requires a ${capitalize(assetTier)} license. Run ${chalk.bold('speckit login')} to authenticate.`,
    };
  }

  // Validate key
  try {
    const status = await validate(credentials.key);

    if (!status.valid) {
      return {
        allowed: false,
        reason: 'key_expired',
        message: 'Your license key has expired. Contact sales for renewal.',
      };
    }

    // Check tier
    if (TIER_LEVEL[status.tier] < TIER_LEVEL[assetTier]) {
      return {
        allowed: false,
        reason: 'tier_insufficient',
        message: `This asset requires an ${capitalize(assetTier)} subscription. Your current tier is ${capitalize(status.tier)}. Contact sales to upgrade.`,
        required_tier: assetTier,
        current_tier: status.tier,
      };
    }

    // Check entitlement list
    if (!status.entitled_assets.includes(assetName)) {
      return {
        allowed: false,
        reason: 'not_entitled',
        message: `Asset "${assetName}" is not included in your subscription. Contact sales to add it.`,
      };
    }

    return { allowed: true, message: '' };
  } catch (err) {
    if (err instanceof LicenseValidationError) {
      return {
        allowed: false,
        reason: err.code as EntitlementCheckResult['reason'],
        message: err.userMessage,
      };
    }
    return {
      allowed: false,
      reason: 'invalid_key',
      message: 'Unable to validate license. Check your network connection and try again.',
    };
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
