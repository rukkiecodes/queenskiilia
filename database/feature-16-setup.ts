/**
 * Feature 16 schema migration — applies the moderation `reports` table to a
 * live database without re-seeding.
 *
 * Run: npx tsx feature-16-setup.ts
 *
 * Idempotent — safe to re-run. CREATE TABLE IF NOT EXISTS and CREATE INDEX
 * IF NOT EXISTS leave existing data alone.
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
    CREATE TABLE IF NOT EXISTS reports (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id UUID        REFERENCES users(id) ON DELETE CASCADE,
      target_type TEXT        NOT NULL CHECK (target_type IN ('user', 'project', 'message')),
      target_id   UUID        NOT NULL,
      reason      TEXT        NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'other')),
      details     TEXT,
      status      TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed', 'actioned')),
      admin_note  TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ
    )
  `);
  console.log('  ✓ reports table');

  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id, status)`
  );
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_reports_open ON reports(status) WHERE status = 'open'`
  );
  console.log('  ✓ reports indices');

  await client.end();
  console.log('\nFeature 16 setup complete.');
}

main().catch((err) => {
  console.error('Feature 16 setup failed:', err);
  process.exit(1);
});
