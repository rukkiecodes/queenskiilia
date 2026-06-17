/**
 * Waitlist schema migration — applies the `waitlist` table for the marketing
 * landing page (landing/) to a live database without re-seeding.
 *
 * Run from the database/ directory: npx tsx waitlist-setup.ts
 * (or from landing/: npm run db:waitlist)
 *
 * Idempotent — safe to re-run. CREATE TABLE/INDEX IF NOT EXISTS leave existing
 * data alone.
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
    CREATE TABLE IF NOT EXISTS waitlist (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name       TEXT,
      email      TEXT        NOT NULL UNIQUE,
      role       TEXT        NOT NULL DEFAULT 'other' CHECK (role IN ('student', 'business', 'other')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('  ✓ waitlist table');

  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at DESC)`
  );
  console.log('  ✓ waitlist index');

  await client.end();
  console.log('\nWaitlist setup complete.');
}

main().catch((err) => {
  console.error('Waitlist setup failed:', err);
  process.exit(1);
});
