#!/usr/bin/env bash
set +e

declare -A SERVICES=(
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
  [main-server]="queenskilla-mainserver"
)

ORDER=(user-service project-service skills-service portfolio-service chat-service notification-service payment-service paystack-service rating-service dispute-service main-server)

push_env() {
  while IFS= read -r line || [ -n "$line" ]; do
    [[ -z "${line// }" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    key="${key// /}"
    [[ -z "$key" ]] && continue
    if [[ "$val" =~ ^\".*\"$ ]] || [[ "$val" =~ ^\'.*\'$ ]]; then
      val="${val:1:-1}"
    fi
    for env in production development; do
      vercel env rm "$key" "$env" --yes >/dev/null 2>&1 || true
      printf '%s' "$val" | vercel env add "$key" "$env" >/dev/null 2>&1 \
        && echo "    + $key ($env)" \
        || echo "    ! failed $key ($env)"
    done
  done < .env
}

for dir in "${ORDER[@]}"; do
  proj="${SERVICES[$dir]}"
  echo ""
  echo "════════════════════════════════════════════"
  echo " $dir → $proj"
  echo "════════════════════════════════════════════"
  cd "$dir" || { echo "MISSING DIR $dir"; continue; }

  echo "[link]"
  vercel link --yes --project "$proj" 2>&1 | tail -3

  echo "[env]"
  push_env

  echo "[deploy]"
  vercel --prod --yes 2>&1 | tail -5

  cd ..
done

echo ""
echo "DONE"
