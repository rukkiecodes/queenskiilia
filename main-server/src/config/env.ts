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
  SERVICE_NAME: optional('SERVICE_NAME', 'main-server'),
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '4000'), 10),

  // Main app DB — pooler params (avoids URL-parsing issues with special chars in password)
  DB_HOST:     required('SUPERBASE_POOL_HOST'),
  DB_PORT:     parseInt(optional('SUPERBASE_POOL_PORT', '5432'), 10),
  DB_DATABASE: optional('SUPERBASE_POOL_DATABASE', 'postgres'),
  DB_USER:     required('SUPERBASE_POOL_USER'),
  DB_PASSWORD: required('SUPERBASE_DB_PASSWORD'),

  // Logging DB — pooler params
  LOGGING_DB_HOST:     required('LOGGING_SUPERBASE_POOL_HOST'),
  LOGGING_DB_PORT:     parseInt(optional('LOGGING_SUPERBASE_POOL_PORT', '5432'), 10),
  LOGGING_DB_DATABASE: optional('LOGGING_SUPERBASE_POOL_DATABASE', 'postgres'),
  LOGGING_DB_USER:     required('LOGGING_SUPERBASE_POOL_USER'),
  LOGGING_DB_PASSWORD: required('LOGGING_SUPERBASE_DB_PASSWORD'),

  // JWT
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '30d'),

  // Telemetry
  SLOW_THRESHOLD_MS: parseInt(optional('SLOW_THRESHOLD_MS', '500'), 10),

  // Internal
  INTERNAL_SECRET: required('INTERNAL_SECRET'),

  // Email service
  EMAIL_SERVICE_URL: optional('EMAIL_SERVICE_URL', 'http://localhost:4011'),

  // Subgraphs
  USER_SERVICE_URL: optional('USER_SERVICE_URL', 'http://localhost:4001/graphql'),
  PROJECT_SERVICE_URL: optional('PROJECT_SERVICE_URL', 'http://localhost:4002/graphql'),
  SKILLS_SERVICE_URL: optional('SKILLS_SERVICE_URL', 'http://localhost:4003/graphql'),
  PORTFOLIO_SERVICE_URL: optional('PORTFOLIO_SERVICE_URL', 'http://localhost:4004/graphql'),
  PAYMENT_SERVICE_URL: optional('PAYMENT_SERVICE_URL', 'http://localhost:4005/graphql'),
  NOTIFICATION_SERVICE_URL: optional('NOTIFICATION_SERVICE_URL', 'http://localhost:4006/graphql'),
  RATING_SERVICE_URL: optional('RATING_SERVICE_URL', 'http://localhost:4007/graphql'),
  DISPUTE_SERVICE_URL: optional('DISPUTE_SERVICE_URL', 'http://localhost:4008/graphql'),
  CHAT_SERVICE_URL: optional('CHAT_SERVICE_URL', 'http://localhost:4009/graphql'),
  PAYSTACK_SERVICE_URL: optional('PAYSTACK_SERVICE_URL', 'http://localhost:4010/graphql'),

  // CORS
  CORS_ORIGINS: optional('CORS_ORIGINS', 'http://localhost:3000').split(',').map(s => s.trim()),
  SOCKET_CORS_ORIGIN: optional('SOCKET_CORS_ORIGIN', 'http://localhost:3000'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  OTP_RATE_LIMIT_WINDOW_MS: parseInt(optional('OTP_RATE_LIMIT_WINDOW_MS', '900000'), 10),
  OTP_RATE_LIMIT_MAX: parseInt(optional('OTP_RATE_LIMIT_MAX', '5'), 10),

  // OTP
  OTP_LENGTH: parseInt(optional('ACTIVATION_CODE_LENGTH', '6'), 10),
  OTP_EXPIRY_MINUTES: parseInt(optional('OTP_EXPIRY_MINUTES', '10'), 10),
} as const;
