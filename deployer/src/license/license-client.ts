/**
 * License client — HTTP client for the SpecKit license server validate endpoint.
 * Used by CLI commands (login, license-status) to validate keys against the server.
 */

import type { LicenseStatus } from '../types.js';
import { getCredentials, getRegistryUrl } from './credential-store.js';

/** Error response from the license server. */
interface ServerErrorResponse {
  error: string;
  message: string;
}

/**
 * Validates a license key against the license server.
 * Returns the LicenseStatus if valid, or throws with a user-friendly message.
 */
export async function validate(key: string, registryUrl?: string): Promise<LicenseStatus> {
  const url = registryUrl || getRegistryUrl(await getCredentials());
  const endpoint = `${url.replace(/\/registry.*$/, '')}/validate`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });

  if (response.ok) {
    return await response.json() as LicenseStatus;
  }

  const errorBody = await response.json() as ServerErrorResponse;
  throw new LicenseValidationError(errorBody.error, errorBody.message);
}

/** Typed error for license validation failures. */
export class LicenseValidationError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string
  ) {
    super(userMessage);
    this.name = 'LicenseValidationError';
  }
}
