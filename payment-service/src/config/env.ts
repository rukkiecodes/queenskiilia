import 'dotenv/config';
function required(k: string) { const v = process.env[k]; if (!v) throw new Error(`Missing: ${k}`); return v; }
function optional(k: string, d: string) { return process.env[k] ?? d; }
export const env = {
  SERVICE_NAME: optional('SERVICE_NAME', 'payment-service'),
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '4005'), 10),
  DB_HOST: required('SUPABASE_POOL_HOST'),
  DB_PORT: parseInt(optional('SUPABASE_POOL_PORT', '5432'), 10),
  DB_DATABASE: optional('SUPABASE_POOL_DATABASE', 'postgres'),
  DB_USER: required('SUPABASE_POOL_USER'),
  DB_PASSWORD: required('SUPABASE_DB_PASSWORD'),
  INTERNAL_SECRET: required('INTERNAL_SECRET'),
  MAIN_SERVER_URL: optional('MAIN_SERVER_URL', 'http://localhost:4000'),
  PAYSTACK_SERVICE_URL: optional('PAYSTACK_SERVICE_URL', 'http://localhost:4010'),
  PLATFORM_FEE_PERCENT: parseFloat(optional('PLATFORM_FEE_PERCENT', '10')),
  // Used to transfer a talent's share to their bank on escrow release.
  PAYSTACK_SECRET_KEY: optional('PAYSTACK_SECRET_KEY', ''),
  PAYSTACK_BASE_URL: optional('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
} as const;
