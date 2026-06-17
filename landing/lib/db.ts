import { Pool } from "pg";

/**
 * Singleton Supabase/Postgres pool. Reuses the same connection variables the
 * rest of the monorepo uses (see database/feature-16-setup.ts). A connection
 * string takes precedence if provided; otherwise discrete pool vars are used.
 *
 * In Vercel, set these as project environment variables. Locally, copy them
 * into landing/.env.local from main-server/.env.
 */
declare global {
  // eslint-disable-next-line no-var
  var __waitlistPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString =
    process.env.SUPABASE_CONNECTION_STRING ||
    process.env.SUPERBASE_CONNECTION_STRING ||
    process.env.DATABASE_URL;

  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }

  return new Pool({
    host: process.env.SUPABASE_POOL_HOST,
    port: parseInt(process.env.SUPABASE_POOL_PORT || "5432", 10),
    database: process.env.SUPABASE_POOL_DATABASE || "postgres",
    user: process.env.SUPABASE_POOL_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });
}

export const pool: Pool = global.__waitlistPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__waitlistPool = pool;
}
