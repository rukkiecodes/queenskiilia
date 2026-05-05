import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  SERVICE_NAME: optional('SERVICE_NAME', 'project-service'),
  NODE_ENV:     optional('NODE_ENV', 'development'),
  PORT:         parseInt(optional('PORT', '4002'), 10),

  // Main app DB — pooler
  DB_HOST:     required('SUPABASE_POOL_HOST'),
  DB_PORT:     parseInt(optional('SUPABASE_POOL_PORT', '5432'), 10),
  DB_DATABASE: optional('SUPABASE_POOL_DATABASE', 'postgres'),
  DB_USER:     required('SUPABASE_POOL_USER'),
  DB_PASSWORD: required('SUPABASE_DB_PASSWORD'),


  INTERNAL_SECRET:   required('INTERNAL_SECRET'),
  MAIN_SERVER_URL:   optional('MAIN_SERVER_URL', 'http://localhost:4000'),
} as const;
