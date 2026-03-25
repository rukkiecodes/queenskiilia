import { Pool } from 'pg';
import { env } from '../config/env';

// Small, dedicated pool for telemetry writes.
// Kept separate from the main app DB so telemetry load never affects business queries.
export const loggingDb = new Pool({
  host:     env.LOGGING_DB_HOST,
  port:     env.LOGGING_DB_PORT,
  database: env.LOGGING_DB_DATABASE,
  user:     env.LOGGING_DB_USER,
  password: env.LOGGING_DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: { rejectUnauthorized: false },
});

loggingDb.on('connect', () => {
  console.log('[LoggingDB] Connected to telemetry database');
});

loggingDb.on('error', (err) => {
  console.error('[LoggingDB] Pool error:', err.message);
});
