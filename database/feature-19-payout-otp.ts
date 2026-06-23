/**
 * Feature 19 schema migration — track a transfer that's awaiting OTP
 * confirmation so an escrow release can be finalized after the OTP is supplied.
 *
 * Run: npx tsx feature-19-payout-otp.ts
 *
 * Idempotent + additive (nullable column) — safe on a live database.
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
    ALTER TABLE escrow_accounts
      ADD COLUMN IF NOT EXISTS pending_transfer_code TEXT
  `);
  console.log('  ✓ escrow_accounts.pending_transfer_code');

  await client.end();
  console.log('\nFeature 19 setup complete.');
}

main().catch((err) => {
  console.error('Feature 19 setup failed:', err);
  process.exit(1);
});
