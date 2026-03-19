/**
 * License status command — displays current license information.
 */

import chalk from 'chalk';
import { getCredentials } from '../license/credential-store.js';
import { validate, LicenseValidationError } from '../license/license-client.js';

/**
 * Executes the license status command.
 */
export async function executeLicenseStatus(): Promise<void> {
  console.log(chalk.bold('\n  SpecKit — License Status\n'));

  const credentials = await getCredentials();
  if (!credentials) {
    console.log(chalk.yellow('  Not authenticated. Run `speckit login` to authenticate.\n'));
    return;
  }

  console.log(chalk.dim('  Checking license status...'));

  try {
    const status = await validate(credentials.key);

    if (status.valid) {
      console.log(chalk.green('  License: Active'));
      console.log(chalk.dim(`  Organization: ${status.org_name}`));
      console.log(chalk.dim(`  Tier: ${formatTier(status.tier)}`));
      if (status.expires_at) {
        const expiresDate = new Date(status.expires_at);
        const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(chalk.dim(`  Expires: ${expiresDate.toLocaleDateString()} (${daysLeft} days)`));
      } else {
        console.log(chalk.dim('  Expires: Never'));
      }
      console.log(chalk.dim(`\n  Entitled Assets (${status.entitled_assets.length}):`));
      for (const asset of status.entitled_assets) {
        console.log(chalk.dim(`    - ${asset}`));
      }
    }
  } catch (err) {
    if (err instanceof LicenseValidationError) {
      console.log(chalk.red(`  License: ${err.userMessage}`));
      console.log(chalk.dim('  Run `speckit login` to re-authenticate.'));
    } else {
      console.log(chalk.red('  Unable to reach the license server. Check your network connection.'));
    }
  }

  console.log('');
}

/**
 * Formats tier name for display.
 */
function formatTier(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
