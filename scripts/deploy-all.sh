#!/usr/bin/env bash
# Link, push env, and deploy every service to Vercel.
# Idempotent — safe to re-run.

set -e

declare -A SERVICES=(
  [main-server]="queenskilla-mainserver"
  [user-service]="queenskilla-user-service"
  [project-service]="queenskilla-project-service"
  [skills-service]="queenskilla-skills-service"
  [portfolio-service]="queenskilla-portfolio-service"
  [chat-service]="queenskilla-chat-service"
  [notification-service]="queenskilla-notification-service"
  [payment-service]="queenskilla-payment-service"
  [paystack-service]="queenskilla-paystack-service"
  [rating-service]="queenskilla-rating-service"
  [dispute-service]="queenskilla-dispute-service"
  [email-service]="queenskilla-email-service"
)

DEPLOY_ORDER=(
  email-service
  user-service
  project-service
  skills-service
  portfolio-service
  chat-service
  notification-service
  payment-service
  paystack-service
  rating-service
  dispute-service
  main-server
)

push_env_from_file() {
  local file=".env"
  [ -f "$file" ] || { echo "  no .env, skipping env push"; return; }

  while IFS= read -r line || [ -n "$line" ]; do
    # Skip blank/comment lines
    [[ -z "${line// }" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    # Split key=value (only on first =)
    key="${line%%=*}"
    val="${line#*=}"
    # Trim whitespace from key
    key="${key// /}"
    [[ -z "$key" ]] && continue
    # Strip surrounding quotes from value
    if [[ "$val" =~ ^\".*\"$ ]] || [[ "$val" =~ ^\'.*\'$ ]]; then
      val="${val:1:-1}"
    fi

    for env in production preview development; do
      vercel env rm "$key" "$env" --yes >/dev/null 2>&1 || true
      printf '%s' "$val" | vercel env add "$key" "$env" >/dev/null 2>&1 \
        && echo "  + $key ($env)" \
        || echo "  ! failed: $key ($env)"
    done
  done < "$file"
}

for dir in "${DEPLOY_ORDER[@]}"; do
  proj="${SERVICES[$dir]}"
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo " $dir → $proj"
  echo "═══════════════════════════════════════════════════════════"
  cd "$dir"

  # Link (creates project on Vercel if it doesn't exist yet)
  if [ ! -f .vercel/project.json ]; then
    echo "Linking…"
    vercel link --yes --project "$proj"
  fi

  echo "Pushing env vars…"
  push_env_from_file

  echo "Deploying to production…"
  vercel --prod --yes

  cd ..
done

echo ""
echo "All services deployed."
