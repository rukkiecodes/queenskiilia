/**
 * Projects get a cover image: `thumbnail_url` (nullable). The web app falls back
 * to a default image when null.
 *
 * Run: npx tsx migrate-project-thumbnail.ts
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
    await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;`);
    console.log('Project thumbnail migration complete.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
