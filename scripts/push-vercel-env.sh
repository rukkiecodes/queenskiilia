#!/usr/bin/env bash
# Push Supabase env vars to every Vercel project for this monorepo.
#
# Prerequisites:
#   1. `vercel login` (one-time interactive)
#   2. Run from repo root: bash scripts/push-vercel-env.sh
#
# What it does:
#   - For each service, links the local dir to its Vercel project (idempotent)
#   - Pushes 9 SUPABASE_* env vars to production + preview
#   - Removes any stale SUPERBASE_* / LOGGING_SUPERBASE_* / SLOW_THRESHOLD_MS
#
# Idempotent: re-running just overwrites values.

set -e

# ── Values (edit if rotated) ────────────────────────────────────────────────
SUPABASE_PROJECT_URL="https://zdbfzavfmqgmnlykrqgv.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_9mHaC0tt0ZS-eYBcRJ0K6A_hmDJwllN"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYmZ6YXZmbXFnbW5seWtycWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5Nzk0MTQsImV4cCI6MjA5MzU1NTQxNH0.886SfAFDxGSuIQ_iTSb1wiTR5tPCeDDqwZmD3L89o2o"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYmZ6YXZmbXFnbW5seWtycWd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk3OTQxNCwiZXhwIjoyMDkzNTU1NDE0fQ.PCEX71cZeGeeMTDG7gibIQ6dE3xVaBqDkT7ILwCSDX4"
SUPABASE_POOL_HOST="aws-1-eu-central-1.pooler.supabase.com"
SUPABASE_POOL_PORT="5432"
SUPABASE_POOL_DATABASE="postgres"
SUPABASE_POOL_USER="postgres.zdbfzavfmqgmnlykrqgv"
SUPABASE_POOL_MODE="session"
SUPABASE_DB_PASSWORD='QueenSkilla001@1;'
SUPABASE_CONNECTION_STRING="postgresql://postgres.zdbfzavfmqgmnlykrqgv:QueenSkilla001%401%3B@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

# service-dir : vercel-project-name
declare -A SERVICES=(
  [main-server]="queenskiilia-main-server"
  [user-service]="queenskilla-user-service"
  [project-service]="queenskiilia-project-service"
  [skills-service]="queenskiilia-skills-service"
  [portfolio-service]="queenskiilia-portfolio-service"
  [chat-service]="queenskiilia-chat-service"
  [notification-service]="queenskiilia-notification-service"
  [payment-service]="queenskiilia-payment-service"
  [paystack-service]="queenskiilia-paystack-service"
  [rating-service]="queenskiilia-rating-service"
  [dispute-service]="queenskiilia-dispute-service"
  [email-service]="queenskiilia-email-service"
)

ENV_KEYS=(
  SUPABASE_PROJECT_URL
  SUPABASE_PUBLISHABLE_KEY
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_POOL_HOST
  SUPABASE_POOL_PORT
  SUPABASE_POOL_DATABASE
  SUPABASE_POOL_USER
  SUPABASE_POOL_MODE
  SUPABASE_DB_PASSWORD
  SUPABASE_CONNECTION_STRING
)

STALE_KEYS=(
  SUPERBASE_PROJECT_URL SUPERBASE_PUBLISHABLE_KEY SUPERBASE_CONNECTION_STRING
  SUPERBASE_POOL_HOST SUPERBASE_POOL_PORT SUPERBASE_POOL_DATABASE
  SUPERBASE_POOL_USER SUPERBASE_POOL_MODE SUPERBASE_DB_PASSWORD
  LOGGING_SUPERBASE_PROJECT_URL LOGGING_SUPERBASE_PUBLISHABLE_KEY
  LOGGING_SUPERBASE_CONNECTION_STRING LOGGING_SUPERBASE_POOL_HOST
  LOGGING_SUPERBASE_POOL_PORT LOGGING_SUPERBASE_POOL_DATABASE
  LOGGING_SUPERBASE_POOL_USER LOGGING_SUPERBASE_POOL_MODE
  LOGGING_SUPERBASE_DB_PASSWORD
  LOGGING_SUPABASE_POOL_HOST LOGGING_SUPABASE_POOL_PORT
  LOGGING_SUPABASE_POOL_DATABASE LOGGING_SUPABASE_POOL_USER
  LOGGING_SUPABASE_POOL_MODE LOGGING_SUPABASE_DB_PASSWORD
  SLOW_THRESHOLD_MS
)

push_var() {
  local key="$1" val="$2"
  for env in production preview development; do
    # Try remove first (silently); then add. Avoids "already exists" errors.
    vercel env rm "$key" "$env" --yes >/dev/null 2>&1 || true
    printf '%s' "$val" | vercel env add "$key" "$env" >/dev/null
  done
  echo "  + $key"
}

remove_stale() {
  local key="$1"
  for env in production preview development; do
    vercel env rm "$key" "$env" --yes >/dev/null 2>&1 || true
  done
}

for dir in "${!SERVICES[@]}"; do
  proj="${SERVICES[$dir]}"
  echo ""
  echo "── $dir → $proj ──────────────────────────────────"
  cd "$dir"

  # Link if needed (idempotent — uses existing .vercel/project.json if present)
  if [ ! -f .vercel/project.json ]; then
    vercel link --yes --project "$proj"
  fi

  echo "Removing stale keys…"
  for k in "${STALE_KEYS[@]}"; do remove_stale "$k"; done

  echo "Pushing Supabase keys…"
  for k in "${ENV_KEYS[@]}"; do push_var "$k" "${!k}"; done

  cd ..
done

echo ""
echo "Done. Trigger redeploys with: vercel --prod (per service) or push to main."
