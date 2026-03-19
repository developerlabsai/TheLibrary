/**
 * Stub deployer — deploys thin stub JSON files into target projects
 * for enterprise-tier assets that resolve content at runtime.
 */

import path from 'path';
import fs from 'fs-extra';
import { getRegistryUrl, getCredentials } from '../license/credential-store.js';
import type { StubFile } from '../types.js';

/**
 * Deploys a stub file for an enterprise-tier asset into the target project.
 * The stub is a lightweight JSON marker that enables runtime resolution.
 */
export async function deployStub(
  assetName: string,
  version: string | undefined,
  targetPath: string,
  registryUrl?: string,
  ttl?: number
): Promise<string> {
  const credentials = await getCredentials();
  const resolvedRegistryUrl = registryUrl || (credentials ? getRegistryUrl(credentials) : 'https://registry.speckit.dev/api/v1');

  const stub: StubFile = {
    speckit_stub: true,
    asset: assetName,
    version: version || 'latest',
    registry: resolvedRegistryUrl,
    ttl: ttl || 86400,
    deployed_at: new Date().toISOString(),
  };

  const stubFileName = `${assetName}.speckit-stub.json`;
  const stubPath = path.join(targetPath, '.speckit', 'stubs', stubFileName);

  await fs.ensureDir(path.dirname(stubPath));
  await fs.writeJson(stubPath, stub, { spaces: 2 });

  return stubPath;
}
