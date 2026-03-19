/**
 * CLI script to create the first super_admin account.
 * Usage: npx tsx src/scripts/create-admin.ts --email admin@devlabs.ai --role super_admin
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf('--email');
  const roleIdx = args.indexOf('--role');

  if (emailIdx === -1 || emailIdx + 1 >= args.length) {
    console.error('Usage: npx tsx src/scripts/create-admin.ts --email <email> [--role admin|super_admin]');
    process.exit(1);
  }

  const email = args[emailIdx + 1];
  const role = roleIdx !== -1 && roleIdx + 1 < args.length ? args[roleIdx + 1] : 'super_admin';

  if (role !== 'admin' && role !== 'super_admin') {
    console.error('Role must be "admin" or "super_admin"');
    process.exit(1);
  }

  // Generate a temporary password (admin should change on first login)
  const tempPassword = `temp_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error('Failed to create auth user:', authError?.message);
    process.exit(1);
  }

  // Extract username from email
  const username = email.split('@')[0];

  // Insert admin account record
  const { error: dbError } = await supabase.from('admin_accounts').insert({
    auth_user_id: authData.user.id,
    username,
    role,
  });

  if (dbError) {
    console.error('Failed to create admin account:', dbError.message);
    // Clean up the auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    process.exit(1);
  }

  console.log(`Admin account created successfully:`);
  console.log(`  Email: ${email}`);
  console.log(`  Username: ${username}`);
  console.log(`  Role: ${role}`);
  console.log(`  Temporary password: ${tempPassword}`);
  console.log(`\nPlease change this password on first login.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
