/**
 * Projects: deadline → duration-from-acceptance.
 *   - add `duration_days` (Int): days the talent has to deliver after selection.
 *   - make `deadline` nullable: it's now computed (NOW() + duration_days) when a
 *     talent is selected, so it's null while a project is still open.
 *
 * Run: npx tsx migrate-project-duration.ts
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
    await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration_days INTEGER;`);
    await client.query(`ALTER TABLE projects ALTER COLUMN deadline DROP NOT NULL;`);
    const { rows } = await client.query(
      `SELECT column_name, is_nullable, data_type
         FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name IN ('duration_days','deadline')
        ORDER BY column_name`
    );
    console.log('projects columns:');
    for (const r of rows) console.log(`  ${r.column_name.padEnd(14)} ${r.data_type.padEnd(28)} nullable=${r.is_nullable}`);
    console.log('Migration complete.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
