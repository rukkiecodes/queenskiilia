import { Pool } from 'pg';
import { env } from '../config/env';

export const loggingDb = new Pool({
  host:     env.LOGGING_DB_HOST,
  port:     env.LOGGING_DB_PORT,
  database: env.LOGGING_DB_DATABASE,
  user:     env.LOGGING_DB_USER,
  password: env.LOGGING_DB_PASSWORD,
  max: 3,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: { rejectUnauthorized: false },
});

loggingDb.on('error', (err) => {
  console.error('[LoggingDB] Pool error:', err.message);
});
