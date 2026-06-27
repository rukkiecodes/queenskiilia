/**
 * Admin accounts live in their own table (separate from app users). Creates the
 * `admins` table if needed and upserts one admin with a bcrypt-hashed password.
 *
 * Usage: npx tsx seed-admin.ts <email> <password> [name]
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

config({ path: resolve(__dirname, '../main-server/.env') });

const DB_CONFIG = {
  host: process.env.SUPABASE_POOL_HOST || '',
  port: parseInt(process.env.SUPABASE_POOL_PORT || '5432'),
  database: process.env.SUPABASE_POOL_DATABASE || 'postgres',
  user: process.env.SUPABASE_POOL_USER || '',
  password: process.env.SUPABASE_DB_PASSWORD || '',
};

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npx tsx seed-admin.ts <email> <password> [name]');
    process.exit(1);
  }

  const client = new Client(DB_CONFIG);
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        email         TEXT        UNIQUE NOT NULL,
        password_hash TEXT        NOT NULL,
        name          TEXT,
        is_active     BOOLEAN     DEFAULT TRUE,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      );
    `);

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await client.query(
      `INSERT INTO admins (email, password_hash, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = COALESCE(EXCLUDED.name, admins.name)
       RETURNING id, email, name`,
      [email.toLowerCase().trim(), hash, name ?? null]
    );
    console.log('Admin upserted:', JSON.stringify(rows[0]));
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
