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
  SERVICE_NAME: optional('SERVICE_NAME', 'notification-service'),
  NODE_ENV:     optional('NODE_ENV', 'development'),
  PORT:         parseInt(optional('PORT', '4006'), 10),

  // Main app DB — pooler
  DB_HOST:     required('SUPERBASE_POOL_HOST'),
  DB_PORT:     parseInt(optional('SUPERBASE_POOL_PORT', '5432'), 10),
  DB_DATABASE: optional('SUPERBASE_POOL_DATABASE', 'postgres'),
  DB_USER:     required('SUPERBASE_POOL_USER'),
  DB_PASSWORD: required('SUPERBASE_DB_PASSWORD'),

  // Logging DB — pooler
  LOGGING_DB_HOST:     required('LOGGING_SUPERBASE_POOL_HOST'),
  LOGGING_DB_PORT:     parseInt(optional('LOGGING_SUPERBASE_POOL_PORT', '5432'), 10),
  LOGGING_DB_DATABASE: optional('LOGGING_SUPERBASE_POOL_DATABASE', 'postgres'),
  LOGGING_DB_USER:     required('LOGGING_SUPERBASE_POOL_USER'),
  LOGGING_DB_PASSWORD: required('LOGGING_SUPERBASE_DB_PASSWORD'),

  INTERNAL_SECRET:   required('INTERNAL_SECRET'),
  MAIN_SERVER_URL:   optional('MAIN_SERVER_URL', 'http://localhost:4000'),
  SLOW_THRESHOLD_MS: parseInt(optional('SLOW_THRESHOLD_MS', '500'), 10),
} as const;
