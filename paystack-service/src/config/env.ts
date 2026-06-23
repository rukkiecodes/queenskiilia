import 'dotenv/config';

function required(k: string) { const v = process.env[k]; if (!v) throw new Error(`Missing: ${k}`); return v; }
function optional(k: string, d: string) { return process.env[k] ?? d; }

export const env = {
  SERVICE_NAME:             optional('SERVICE_NAME', 'paystack-service'),
  NODE_ENV:                 optional('NODE_ENV', 'development'),
  PORT:                     parseInt(optional('PORT', '4010'), 10),
  DB_HOST:                  required('SUPABASE_POOL_HOST'),
  DB_PORT:                  parseInt(optional('SUPABASE_POOL_PORT', '5432'), 10),
  DB_DATABASE:              optional('SUPABASE_POOL_DATABASE', 'postgres'),
  DB_USER:                  required('SUPABASE_POOL_USER'),
  DB_PASSWORD:              required('SUPABASE_DB_PASSWORD'),
  INTERNAL_SECRET:          required('INTERNAL_SECRET'),
  PAYSTACK_SECRET_KEY:      optional('PAYSTACK_SECRET_KEY', ''),
  PAYSTACK_PUBLIC_KEY:      optional('PAYSTACK_PUBLIC_KEY', ''),
  PAYSTACK_BASE_URL:        optional('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
  PAYSTACK_WEBHOOK_SECRET:  optional('PAYSTACK_WEBHOOK_SECRET', ''),

  // Platform commission kept on each talent payout (percentage_charge on the
  // talent's subaccount — the main account's cut of every split payment).
  PLATFORM_FEE_PERCENT:     parseFloat(optional('PLATFORM_FEE_PERCENT', '10')),
  // 'manual' holds the talent's split at Paystack until the platform settles it
  // on approval (escrow-preserving — recommended). 'auto' settles on Paystack's
  // normal ~T+1 schedule with no approval gate. Flip via env, no code change.
  SUBACCOUNT_SETTLEMENT_SCHEDULE: optional('SUBACCOUNT_SETTLEMENT_SCHEDULE', 'manual'),
} as const;
