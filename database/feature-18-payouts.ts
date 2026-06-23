/**
 * Feature 18 schema migration — talent payout fields on student_profiles, used
 * to create and reference each talent's Paystack subaccount.
 *
 * Run: npx tsx feature-18-payouts.ts
 *
 * Idempotent + additive (ADD COLUMN IF NOT EXISTS, all nullable) — safe to run
 * against a live database; leaves existing rows untouched.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { Client } from 'pg';

config({ path: resolve(__dirname, '../main-server/.env') });

async function main() {
  const client = new Client({
    host:     process.env.SUPABASE_POOL_HOST,
    port:     parseInt(process.env.SUPABASE_POOL_PORT || '5432'),
    database: process.env.SUPABASE_POOL_DATABASE || 'postgres',
    user:     process.env.SUPABASE_POOL_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl:      { rejectUnauthorized: false },
  });
  await client.connect();

  await client.query(`
    ALTER TABLE student_profiles
      ADD COLUMN IF NOT EXISTS bank_code                TEXT,
      ADD COLUMN IF NOT EXISTS account_number           TEXT,
      ADD COLUMN IF NOT EXISTS account_name             TEXT,
      ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT
  `);
  console.log('  ✓ student_profiles payout columns (bank_code, account_number, account_name, paystack_subaccount_code)');

  await client.end();
  console.log('\nFeature 18 setup complete.');
}

main().catch((err) => {
  console.error('Feature 18 setup failed:', err);
  process.exit(1);
});
