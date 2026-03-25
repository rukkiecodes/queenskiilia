/**
 * Logging Database Seed
 * Target: twkpanclxiutttatvngk (dedicated telemetry Supabase instance)
 *
 * Run: npx tsx seed-logging.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Client } from 'pg';

config({ path: resolve(__dirname, '../main-server/.env') });

// Use individual params to avoid URL-parsing issues with special chars in password
const DB_CONFIG = {
  host:     process.env.LOGGING_SUPERBASE_POOL_HOST     || '',
  port:     parseInt(process.env.LOGGING_SUPERBASE_POOL_PORT || '5432'),
  database: process.env.LOGGING_SUPERBASE_POOL_DATABASE || 'postgres',
  user:     process.env.LOGGING_SUPERBASE_POOL_USER     || '',
  password: process.env.LOGGING_SUPERBASE_DB_PASSWORD   || '',
};

if (!DB_CONFIG.host || !DB_CONFIG.user || !DB_CONFIG.password) {
  console.error('Missing Logging Supabase connection vars in main-server/.env');
  process.exit(1);
}

// ── Schema ────────────────────────────────────────────────────────────────────

const SCHEMA = `
-- ── Telemetry events ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telemetry_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service        TEXT        NOT NULL,
  operation_type TEXT        NOT NULL,
  operation_name TEXT        NOT NULL,
  resolver_path  TEXT,
  user_id        TEXT,
  duration_ms    FLOAT       NOT NULL,
  status         TEXT        NOT NULL  CHECK (status IN ('success', 'error')),
  error_message  TEXT,
  error_code     TEXT,
  meta           JSONB,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tel_service   ON telemetry_events(service);
CREATE INDEX IF NOT EXISTS idx_tel_timestamp ON telemetry_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tel_status    ON telemetry_events(status);
CREATE INDEX IF NOT EXISTS idx_tel_op_name   ON telemetry_events(operation_name);
CREATE INDEX IF NOT EXISTS idx_tel_user      ON telemetry_events(user_id);

-- ── Service heartbeats ────────────────────────────────────────────────────────
-- One row per service, upserted on every telemetry write.
-- Super admin reads this to check which services are alive.
CREATE TABLE IF NOT EXISTS service_heartbeats (
  service      TEXT        PRIMARY KEY,
  last_seen_at TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

// ── Seed — initial heartbeat rows so the super admin dashboard shows all services ──

const SEED = `
INSERT INTO service_heartbeats (service, last_seen_at)
VALUES
  ('main-server',         NOW() - INTERVAL '999 years'),
  ('user-service',        NOW() - INTERVAL '999 years'),
  ('project-service',     NOW() - INTERVAL '999 years'),
  ('skills-service',      NOW() - INTERVAL '999 years'),
  ('portfolio-service',   NOW() - INTERVAL '999 years'),
  ('payment-service',     NOW() - INTERVAL '999 years'),
  ('paystack-service',    NOW() - INTERVAL '999 years'),
  ('notification-service',NOW() - INTERVAL '999 years'),
  ('email-service',       NOW() - INTERVAL '999 years'),
  ('rating-service',      NOW() - INTERVAL '999 years'),
  ('dispute-service',     NOW() - INTERVAL '999 years'),
  ('chat-service',        NOW() - INTERVAL '999 years'),
  ('admin-service',       NOW() - INTERVAL '999 years'),
  ('super-admin-service', NOW() - INTERVAL '999 years')
ON CONFLICT (service) DO NOTHING;
`;

// ── Runner ────────────────────────────────────────────────────────────────────

async function run() {
  const client = new Client({ ...DB_CONFIG, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('\n[Logging DB] Connected\n');

    console.log('  Creating schema...');
    await client.query(SCHEMA);
    console.log('  ✓ telemetry_events');
    console.log('  ✓ service_heartbeats');

    console.log('\n  Seeding heartbeat rows...');
    await client.query(SEED);
    console.log('  ✓ 14 service rows inserted\n');

    console.log('[Logging DB] Done.\n');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('[Logging DB] Error:', err.message);
  process.exit(1);
});
