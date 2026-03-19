/**
 * Login command — authenticates the CLI with a license key.
 * Validates the key against the license server before storing locally.
 */

import chalk from 'chalk';
import { createInterface } from 'readline';
import { validate, LicenseValidationError } from '../license/license-client.js';
import { saveCredentials } from '../license/credential-store.js';

/**
 * Executes the login command.
 * Accepts --key flag or prompts interactively.
 */
export async function executeLogin(keyFlag?: string): Promise<void> {
  console.log(chalk.bold('\n  SpecKit — License Authentication\n'));

  let key = keyFlag;

  if (!key) {
    key = await promptForKey();
  }

  if (!key) {
    console.log(chalk.red('  No license key provided.'));
    return;
  }

  console.log(chalk.dim('  Validating license key...'));

  try {
    const status = await validate(key);

    if (status.valid) {
      await saveCredentials(key);
      console.log(chalk.green(`  Authenticated successfully!`));
      console.log(chalk.dim(`  Organization: ${status.org_name}`));
      console.log(chalk.dim(`  Tier: ${status.tier}`));
      if (status.expires_at) {
        console.log(chalk.dim(`  Expires: ${new Date(status.expires_at).toLocaleDateString()}`));
      }
      console.log(chalk.dim(`  Entitled assets: ${status.entitled_assets.length}`));
    }
  } catch (err) {
    if (err instanceof LicenseValidationError) {
      console.log(chalk.red(`  Authentication failed: ${err.userMessage}`));
    } else {
      console.log(chalk.red(`  Unable to reach the license server. Check your network connection.`));
    }
  }

  console.log('');
}

/**
 * Prompts the user to enter a license key interactively.
 */
async function promptForKey(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('  Enter your license key: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
