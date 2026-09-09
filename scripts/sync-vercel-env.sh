#!/usr/bin/env bash
# Ops: paste Suby + Neon secrets into Vercel Production (run locally with VERCEL_TOKEN).
# Usage:
#   export VERCEL_TOKEN=...
#   export SUBY_API_KEY=sk_live_...
#   export SUBY_WEBHOOK_SECRET=whsec_...
#   export DATABASE_URL=postgresql://...
#   ./scripts/sync-vercel-env.sh temporary-prompt-savanna-pzvu0qr
set -euo pipefail
PROJECT="${1:-temporary-prompt-savanna-pzvu0qr}"
add_env() {
  local name="$1" value="$2"
  if [[ -z "${value:-}" ]]; then echo "skip $name (unset)"; return; fi
  printf '%s' "$value" | npx vercel@latest env add "$name" production --force --token "$VERCEL_TOKEN" --scope darweesh128-4945s-projects 2>/dev/null \
    || printf '%s' "$value" | npx vercel@latest env add "$name" production --force --token "$VERCEL_TOKEN"
  echo "set $name"
}
add_env SUBY_API_KEY "${SUBY_API_KEY:-}"
add_env SUBY_WEBHOOK_SECRET "${SUBY_WEBHOOK_SECRET:-}"
add_env DATABASE_URL "${DATABASE_URL:-}"
echo "Done. Trigger a git push to main for a fresh Production deploy (not prebuilt Redeploy)."
