import { Pool } from 'pg';
import { env } from '../config/env';

export const db = new Pool({
  host:     env.DB_HOST,
  port:     env.DB_PORT,
  database: env.DB_DATABASE,
  user:     env.DB_USER,
  password: env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: { rejectUnauthorized: false },
});

db.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
});
