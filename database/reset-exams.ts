/**
 * Reset skill-exam data — clears exams, questions, attempts, answers and
 * certificates. The skills_catalog is ALWAYS preserved (it's the canonical
 * catalog admins author exams against).
 *
 * Safety: dry-run by default (prints what would be removed). Pass --yes to
 * actually delete. Idempotent — safe to re-run.
 *
 * Usage:
 *   npx tsx reset-exams.ts          # dry run (counts only)
 *   npx tsx reset-exams.ts --yes    # delete the exam data
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

// FK-safe delete order (children first). Deleting skill_exams alone would
// cascade, but explicit ordering is clearer and tolerates any orphans.
const TABLES = ['certificates', 'exam_answers', 'exam_attempts', 'exam_questions', 'skill_exams'] as const;

async function counts(client: Client) {
  const out: Record<string, number> = {};
  for (const t of [...TABLES, 'skills_catalog']) {
    out[t] = (await client.query(`SELECT COUNT(*)::int AS n FROM ${t}`)).rows[0].n;
  }
  return out;
}

function print(label: string, c: Record<string, number>) {
  console.log(label);
  for (const t of TABLES) console.log(`  ${t.padEnd(16)} ${c[t]}`);
  console.log(`  (skills_catalog preserved: ${c.skills_catalog})`);
}

async function main() {
  const confirm = process.argv.includes('--yes') || process.argv.includes('-y');
  const client = new Client(DB_CONFIG);
  await client.connect();
  try {
    print('Current exam data:', await counts(client));

    if (!confirm) {
      console.log('\nDry run — re-run with --yes to delete the above. skills_catalog is kept.');
      return;
    }

    await client.query('BEGIN');
    for (const t of TABLES) await client.query(`DELETE FROM ${t}`);
    await client.query('COMMIT');

    print('\nReset complete — exam data cleared:', await counts(client));
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
