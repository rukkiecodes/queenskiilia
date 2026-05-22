/**
 * Feature 15 schema migration — applies the two additions Settings & Account
 * needs without re-seeding:
 *
 *   1. users.deletion_requested_at  — soft-delete stamp for the 30-day window
 *   2. notification_preferences     — per-user category mute toggles
 *
 * Run: npx tsx feature-15-setup.ts
 *
 * Idempotent — safe to re-run. Uses ADD COLUMN IF NOT EXISTS / CREATE TABLE
 * IF NOT EXISTS so existing rows are untouched.
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

  await client.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ`
  );
  console.log('  ✓ users.deletion_requested_at');

  await client.query(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id         UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      project_updates BOOLEAN     NOT NULL DEFAULT TRUE,
      messages        BOOLEAN     NOT NULL DEFAULT TRUE,
      payments        BOOLEAN     NOT NULL DEFAULT TRUE,
      system          BOOLEAN     NOT NULL DEFAULT TRUE,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('  ✓ notification_preferences table');

  await client.end();
  console.log('\nFeature 15 setup complete.');
}

main().catch((err) => {
  console.error('Feature 15 setup failed:', err);
  process.exit(1);
});
