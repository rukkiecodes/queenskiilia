/**
 * Clear all dummy / test / transactional data from the main database.
 *
 * Run: npx tsx clear-dummy-data.ts
 *
 * TRUNCATEs every user/transactional table (RESTART IDENTITY CASCADE) so the app
 * starts from a clean slate for testing. KEEPS:
 *   - skill_categories  → reference catalog the app needs to function
 *   - waitlist          → potentially real landing-page signups
 * Only truncates tables that actually exist (safe across partial migrations).
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Client } from 'pg';

config({ path: resolve(__dirname, '../main-server/.env') });

const DB_CONFIG = {
  host:     process.env.SUPABASE_POOL_HOST     || '',
  port:     parseInt(process.env.SUPABASE_POOL_PORT || '5432'),
  database: process.env.SUPABASE_POOL_DATABASE || 'postgres',
  user:     process.env.SUPABASE_POOL_USER     || '',
  password: process.env.SUPABASE_DB_PASSWORD   || '',
};

if (!DB_CONFIG.host || !DB_CONFIG.user || !DB_CONFIG.password) {
  console.error('Missing Supabase connection vars in main-server/.env');
  process.exit(1);
}

// User / transactional data to wipe.
const WIPE = [
  'messages', 'chats', 'reports', 'disputes',
  'notifications', 'notification_preferences', 'ratings',
  'submissions', 'milestones', 'applications',
  'escrow_accounts', 'payment_transactions', 'portfolio_items',
  'assessment_sessions', 'skill_assessments', 'user_verifications',
  'projects', 'student_profiles', 'business_profiles',
  'refresh_tokens', 'otp_tokens', 'users',
];

// Intentionally preserved.
const KEEP = ['skill_categories', 'waitlist'];

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const existing = new Set(rows.map((r: any) => r.table_name));
    const toClear = WIPE.filter((t) => existing.has(t));

    console.log('Database:', DB_CONFIG.host, '/', DB_CONFIG.database);
    console.log('\nBEFORE — row counts:');
    for (const t of [...toClear, ...KEEP]) {
      if (!existing.has(t)) continue;
      const { rows: c } = await client.query(`SELECT count(*)::int AS n FROM "${t}"`);
      console.log(`  ${t.padEnd(26)} ${c[0].n}`);
    }

    if (toClear.length) {
      const list = toClear.map((t) => `"${t}"`).join(', ');
      await client.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
    }

    console.log('\nAFTER — row counts:');
    for (const t of [...toClear, ...KEEP]) {
      if (!existing.has(t)) continue;
      const { rows: c } = await client.query(`SELECT count(*)::int AS n FROM "${t}"`);
      console.log(`  ${t.padEnd(26)} ${c[0].n}`);
    }
    console.log(`\nCleared ${toClear.length} tables. Kept: ${KEEP.filter((t) => existing.has(t)).join(', ')}`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
