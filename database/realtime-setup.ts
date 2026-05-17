/**
 * Enables Supabase Realtime on the chat-relevant tables.
 * Run: npx tsx realtime-setup.ts
 *
 * Idempotent — safe to re-run. Tables that are already in the publication or
 * already have FULL replica identity raise harmless notices.
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

  // REPLICA IDENTITY FULL — UPDATE/DELETE events carry the full old row,
  // required so subscribers can see is_read transitions and message edits.
  await client.query('ALTER TABLE messages REPLICA IDENTITY FULL');
  await client.query('ALTER TABLE chats    REPLICA IDENTITY FULL');

  // Add tables to the supabase_realtime publication. We try ADD; if already a
  // member Postgres raises an error that we swallow.
  for (const table of ['messages', 'chats']) {
    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE ${table}`);
      console.log(`  ✓ ${table} added to supabase_realtime`);
    } catch (err: any) {
      if (err.code === '42710') {
        // duplicate_object — table already in publication
        console.log(`  · ${table} already in supabase_realtime`);
      } else {
        throw err;
      }
    }
  }

  await client.end();
  console.log('\nRealtime setup complete.');
}

main().catch((err) => {
  console.error('Realtime setup failed:', err);
  process.exit(1);
});
