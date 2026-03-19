/**
 * Logout command — removes the stored license key.
 */

import chalk from 'chalk';
import { deleteCredentials } from '../license/credential-store.js';

/**
 * Executes the logout command.
 */
export async function executeLogout(): Promise<void> {
  await deleteCredentials();
  console.log(chalk.green('\n  Logged out. License key removed from ~/.speckit/credentials.\n'));
}
