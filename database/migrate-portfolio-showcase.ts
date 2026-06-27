/**
 * Portfolio showcase: talent-curated media + social likes.
 *   - image_urls / video_url / live_url: media the talent adds to a portfolio item.
 *   - portfolio_likes: one row per (item, user) like, for public like counts.
 *
 * Run: npx tsx migrate-portfolio-showcase.ts
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
    await client.query(`ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';`);
    await client.query(`ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS video_url TEXT;`);
    await client.query(`ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS live_url TEXT;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS portfolio_likes (
        item_id    UUID REFERENCES portfolio_items(id) ON DELETE CASCADE,
        user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (item_id, user_id)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_portfolio_likes_item ON portfolio_likes(item_id);`);
    console.log('Portfolio showcase migration complete.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
