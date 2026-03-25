import 'dotenv/config';

function required(k: string) { const v = process.env[k]; if (!v) throw new Error(`Missing: ${k}`); return v; }
function optional(k: string, d: string) { return process.env[k] ?? d; }

export const env = {
  SERVICE_NAME:             optional('SERVICE_NAME', 'paystack-service'),
  NODE_ENV:                 optional('NODE_ENV', 'development'),
  PORT:                     parseInt(optional('PORT', '4010'), 10),
  DB_HOST:                  required('SUPERBASE_POOL_HOST'),
  DB_PORT:                  parseInt(optional('SUPERBASE_POOL_PORT', '5432'), 10),
  DB_DATABASE:              optional('SUPERBASE_POOL_DATABASE', 'postgres'),
  DB_USER:                  required('SUPERBASE_POOL_USER'),
  DB_PASSWORD:              required('SUPERBASE_DB_PASSWORD'),
  LOGGING_DB_HOST:          required('LOGGING_SUPERBASE_POOL_HOST'),
  LOGGING_DB_PORT:          parseInt(optional('LOGGING_SUPERBASE_POOL_PORT', '5432'), 10),
  LOGGING_DB_DATABASE:      optional('LOGGING_SUPERBASE_POOL_DATABASE', 'postgres'),
  LOGGING_DB_USER:          required('LOGGING_SUPERBASE_POOL_USER'),
  LOGGING_DB_PASSWORD:      required('LOGGING_SUPERBASE_DB_PASSWORD'),
  INTERNAL_SECRET:          required('INTERNAL_SECRET'),
  SLOW_THRESHOLD_MS:        parseInt(optional('SLOW_THRESHOLD_MS', '500'), 10),
  PAYSTACK_SECRET_KEY:      optional('PAYSTACK_SECRET_KEY', ''),
  PAYSTACK_PUBLIC_KEY:      optional('PAYSTACK_PUBLIC_KEY', ''),
  PAYSTACK_BASE_URL:        optional('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
  PAYSTACK_WEBHOOK_SECRET:  optional('PAYSTACK_WEBHOOK_SECRET', ''),
} as const;
