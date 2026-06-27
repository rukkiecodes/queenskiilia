/**
 * Fix submissions status constraint: it was missing 'submitted', but submitWork
 * (and the whole frontend SubmissionStatus type) uses 'submitted' as the status
 * of newly-delivered work → every submission failed the check constraint.
 *
 * Run: npx tsx migrate-submission-status.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { Client } from 'pg';

config({ path: resolve(__dirname, '../main-server/.env') });

const DB_CONFIG = {
  host: process.env.SUPABASE_POOL_HOST || '',
  port: parseInt(process.env.SUPABASE_POOL_PORT || '5432'),
  database: process.env.SUPABASE_POOL_DATABASE || 'postgres',
  user: process.env.SUPABASE_POOL_USER || '',
  password: process.env.SUPABASE_DB_PASSWORD || '',
};

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  try {
    await client.query(`ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;`);
    await client.query(
      `ALTER TABLE submissions ADD CONSTRAINT submissions_status_check
         CHECK (status IN ('pending', 'submitted', 'approved', 'revision_requested'));`
    );
    const { rows } = await client.query(
      `SELECT pg_get_constraintdef(oid) AS def
         FROM pg_constraint WHERE conname = 'submissions_status_check'`
    );
    console.log('submissions_status_check =>', rows[0]?.def);
    console.log('Migration complete.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
