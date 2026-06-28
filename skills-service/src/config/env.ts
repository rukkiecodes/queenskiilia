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
  SERVICE_NAME: optional('SERVICE_NAME', 'skills-service'),
  NODE_ENV:     optional('NODE_ENV', 'development'),
  PORT:         parseInt(optional('PORT', '4003'), 10),

  // Main app DB — pooler
  DB_HOST:     required('SUPABASE_POOL_HOST'),
  DB_PORT:     parseInt(optional('SUPABASE_POOL_PORT', '5432'), 10),
  DB_DATABASE: optional('SUPABASE_POOL_DATABASE', 'postgres'),
  DB_USER:     required('SUPABASE_POOL_USER'),
  DB_PASSWORD: required('SUPABASE_DB_PASSWORD'),


  INTERNAL_SECRET:   required('INTERNAL_SECRET'),
  MAIN_SERVER_URL:   optional('MAIN_SERVER_URL', 'http://localhost:4000'),

  // ai-service (Gemini) — internal HTTP. AI_INTERNAL_KEY must match the
  // ai-service's INTERNAL_API_KEY (sent as the x-internal-key header).
  AI_SERVICE_URL:    optional('AI_SERVICE_URL', 'https://ai-service-psi-ashen.vercel.app'),
  AI_INTERNAL_KEY:   optional('AI_INTERNAL_KEY', ''),
} as const;
