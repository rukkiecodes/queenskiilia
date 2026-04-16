import 'dotenv/config';

function required(k: string) { const v = process.env[k]; if (!v) throw new Error(`Missing: ${k}`); return v; }
function optional(k: string, d: string) { return process.env[k] ?? d; }

export const env = {
  SERVICE_NAME:        optional('SERVICE_NAME', 'email-service'),
  NODE_ENV:            optional('NODE_ENV', 'development'),
  PORT:                parseInt(optional('PORT', '4011'), 10),
  INTERNAL_SECRET:     required('INTERNAL_SECRET'),
  SLOW_THRESHOLD_MS:   parseInt(optional('SLOW_THRESHOLD_MS', '500'), 10),

  LOGGING_DB_HOST:     required('LOGGING_SUPERBASE_POOL_HOST'),
  LOGGING_DB_PORT:     parseInt(optional('LOGGING_SUPERBASE_POOL_PORT', '5432'), 10),
  LOGGING_DB_DATABASE: optional('LOGGING_SUPERBASE_POOL_DATABASE', 'postgres'),
  LOGGING_DB_USER:     required('LOGGING_SUPERBASE_POOL_USER'),
  LOGGING_DB_PASSWORD: required('LOGGING_SUPERBASE_DB_PASSWORD'),

  SMTP_HOST:     optional('SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT:     parseInt(optional('SMTP_PORT', '465'), 10),
  SMTP_SECURE:   optional('SMTP_SECURE', 'true') === 'true',
  SMTP_USER:     required('MAILING_EMAIL'),
  SMTP_PASS:     required('MAILING_PASSWORD'),
  FROM_EMAIL:    optional('MAILING_EMAIL', 'noreply@queenskiilia.com'),
  FROM_NAME:     optional('FROM_NAME', 'Queen Skilla'),
} as const;
