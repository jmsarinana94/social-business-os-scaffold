#!/usr/bin/env bash
# Smoke/seed script for local API (multi-tenant compatible)
# Works on macOS/BSD & Linux.
set -euo pipefail

# -----------------------------
# Config & CLI
# -----------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

FLAG_JSON=0
FLAG_CI=0
SEED_COUNT=0

while (( "$#" )); do
  case "$1" in
    --json) FLAG_JSON=1; shift ;;
    --ci)   FLAG_CI=1; shift ;;
    --seed) SEED_COUNT="${2:-0}"; shift 2 ;;
    -h|--help)
      cat <<'H'
Usage:
  bash apps/api/scripts/smoke.sh [--json] [--ci] [--seed N]

Flags:
  --json        Output machine-friendly JSON summary.
  --ci          CI-friendly (no prompts).
  --seed N      Create N demo products after the smoke flow.

Environment:
  API_BASE      Base URL for API (e.g., http://127.0.0.1:56425)
  ORG_SLUG      Override tenant slug (otherwise auto-detected or 'demo-org').
H
      exit 0 ;;
    *) shift ;;
  esac
done

# -----------------------------
# Logging helpers
# -----------------------------
info() { printf "ℹ️  %s\n" "$*"; }
ok()   { printf "✅ %s\n" "$*"; }
warn() { printf "⚠️  %s\n" "$*"; }
err()  { printf "❌ %s\n" "$*" >&2; }

# -----------------------------
# Detect BASE
# -----------------------------
read_api_base_from_env_file() {
  local f="${API_DIR}/.env.local"
  if [[ -f "$f" ]]; then
    local line
    line="$(grep -E '^API_BASE=' "$f" 2>/dev/null | tail -n1 || true)"
    if [[ -n "$line" ]]; then
      local val="${line#API_BASE=}"
      val="${val%\"}"; val="${val#\"}"
      val="${val%\'}"; val="${val#\'}"
      echo "$val"
      return 0
    fi
  fi
  return 1
}

discover_base() {
  if [[ -n "${API_BASE:-}" ]]; then
    echo "$API_BASE"
    return 0
  fi
  local from_file
  if from_file="$(read_api_base_from_env_file)"; then
    echo "$from_file"
    return 0
  fi
  # last resort default
  echo "http://127.0.0.1:3000"
}

BASE="$(discover_base)"
PID_HINT="$(pgrep -n node || true)"
ENV_HINT="${NODE_ENV:-local}"
info "Using BASE=${BASE} (PID=${PID_HINT:-n/a}) ENV=${ENV_HINT}"

# -----------------------------
# HTTP helpers
# -----------------------------
TOKEN=""
ORG_SLUG="${ORG_SLUG:-}"   # allow override via env

http_post_json() {
  local url="$1"; shift
  local body="$1"; shift
  curl -sS -m 15 -H "Content-Type: application/json" "$@" -d "$body" "$url"
}

http_get() {
  local url="$1"
  curl -sS -m 15 "$url"
}

http_auth_get() {
  local url="$1"
  curl -sS -m 15 \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-Org: ${ORG_SLUG}" \
    "$url"
}

http_auth_post_json() {
  local url="$1"; local body="$2"
  curl -sS -m 20 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-Org: ${ORG_SLUG}" \
    -d "$body" "$url"
}

# -----------------------------
# Auth flow
# -----------------------------
USER_EMAIL="tester@example.com"
USER_PASS="Passw0rd!"
USER_ORG="default-org"

signup_and_login() {
  local signup_body login_body res
  signup_body="$(cat <<JSON
{"email":"${USER_EMAIL}","password":"${USER_PASS}","org":"${USER_ORG}"}
JSON
)"
  login_body="$(cat <<JSON
{"email":"${USER_EMAIL}","password":"${USER_PASS}"}
JSON
)"
  # Best-effort signup; ignore errors if already exists
  http_post_json "${BASE}/auth/signup" "$signup_body" > /dev/null 2>&1 || true

  res="$(http_post_json "${BASE}/auth/login" "$login_body")"
  if ! echo "$res" | grep -q '"token"'; then
    return 1
  fi
  TOKEN="$(echo "$res" | sed -nE 's/.*"token":"?([^",}]+).*/\1/p')"
  [[ -n "$TOKEN" ]]
}

if signup_and_login; then
  ok "Token acquired"
else
  err "Could not obtain token via signup/login"
  [[ "$FLAG_JSON" -eq 1 ]] && echo '{"ok":false,"error":"auth_failed"}'
  exit 1
fi

ME_JSON="$(http_auth_get "${BASE}/auth/me" || true)"
[[ "$FLAG_JSON" -eq 0 && -n "$ME_JSON" ]] && echo "🙋 ${ME_JSON}"

# -----------------------------
# Auto-detect org slug
# -----------------------------
if [[ -z "${ORG_SLUG}" ]]; then
  # Try to pull org slug from /auth/me (supporting different shapes)
  # Accept: {"org":"default-org"} OR {"org":{"slug":"..."}}
  if echo "$ME_JSON" | grep -q '"org":"[^"]\+"'; then
    ORG_SLUG="$(echo "$ME_JSON" | sed -nE 's/.*"org":"([^"]+)".*/\1/p')"
  elif echo "$ME_JSON" | grep -q '"org":{'; then
    ORG_SLUG="$(echo "$ME_JSON" | sed -nE 's/.*"org":\{[^}]*"slug":"([^"]+)".*/\1/p')"
  fi
fi
ORG_SLUG="${ORG_SLUG:-demo-org}"

# -----------------------------
# Ensure org exists
# -----------------------------
ensure_org() {
  # create is idempotent (ignore error if exists)
  http_auth_post_json "${BASE}/orgs" "{\"slug\":\"${ORG_SLUG}\",\"name\":\"Demo Org\"}" >/dev/null 2>&1 || true
  http_auth_get "${BASE}/orgs/${ORG_SLUG}"
}

ORG_JSON="$(ensure_org)"
if [[ -z "$ORG_JSON" ]]; then
  err "Could not ensure/fetch org '${ORG_SLUG}'"
  [[ "$FLAG_JSON" -eq 1 ]] && echo '{"ok":false,"error":"org_failed"}'
  exit 1
fi
[[ "$FLAG_JSON" -eq 0 ]] && echo "🔎 ${ORG_JSON}"

# -----------------------------
# Create product
# -----------------------------
create_product() {
  local sku="SMOKE-$(date +%s)"
  local body
  body="$(cat <<JSON
{"sku":"${sku}","title":"Smoke Test Product","type":"PHYSICAL","status":"ACTIVE","price":19.99}
JSON
)"
  http_auth_post_json "${BASE}/products" "$body"
}

PROD_JSON="$(create_product || true)"
if [[ -n "$PROD_JSON" && "$FLAG_JSON" -eq 0 ]]; then
  if echo "$PROD_JSON" | grep -q '"id"'; then
    PROD_ID="$(echo "$PROD_JSON" | sed -nE 's/.*"id":"?([^",}]+).*/\1/p')"
    ok "Product created: ${PROD_ID}"
  else
    warn "Product creation returned no ID (already seeded or DTO mismatch)"
  fi
fi

# -----------------------------
# List products
# -----------------------------
LIST_JSON="$(http_auth_get "${BASE}/products" || true)"
[[ "$FLAG_JSON" -eq 0 && -n "$LIST_JSON" ]] && echo "📦 ${LIST_JSON}"

# -----------------------------
# Increment inventory using JSON body
# -----------------------------
increment_inventory_if_possible() {
  local last_id
  # Pick the last created product (simple heuristic)
  last_id="$(echo "$LIST_JSON" | tr -d '\n' | sed -nE 's/.*\{"id":"([^"]+)","sku":"SMOKE-[^"]+".*/\1/p' | tail -n1)"
  [[ -z "$last_id" ]] && return 0
  local url="${BASE}/products/${last_id}/inventory"
  local body='{"delta":5}'
  http_auth_post_json "$url" "$body"
}

INV_JSON="$(increment_inventory_if_possible || true)"
[[ "$FLAG_JSON" -eq 0 && -n "$INV_JSON" ]] && echo "📈 Try inventory increment (+5)\n${INV_JSON}"

# -----------------------------
# Optional seeding
# -----------------------------
seed_products() {
  local n="$1"
  [[ "$n" -gt 0 ]] || return 0
  local i
  for ((i=1; i<=n; i++)); do
    # simple price curve; awk used only for float math
    local price
    price="$(awk "BEGIN {printf \"%.2f\", 9.99 + ($i*2.49)}")"
    http_auth_post_json "${BASE}/products" "$(cat <<JSON
{"sku":"SMOKE-$((RANDOM%32768))-${i}","title":"Demo Product ${i}","type":"PHYSICAL","status":"ACTIVE","price":${price}}
JSON
)" >/dev/null || true
  done
}

if [[ "$SEED_COUNT" -gt 0 ]]; then
  [[ "$FLAG_JSON" -eq 0 ]] && info "Seeding ${SEED_COUNT} products..."
  seed_products "$SEED_COUNT"
  LIST_JSON="$(http_auth_get "${BASE}/products" || true)"
fi

# -----------------------------
# Output
# -----------------------------
if [[ "$FLAG_JSON" -eq 1 ]]; then
  count="$(echo "$LIST_JSON" | grep -o '"title":"[^"]*"' | wc -l | tr -d ' ')"
  sample="$(echo "$LIST_JSON" | sed -n '1,200p')"
  printf '{'
  printf '"ok":true,"base":%q,' "$BASE"
  printf '"org":%q,' "$ORG_SLUG"
  printf '"products":%s,' "${count:-0}"
  printf '"sample":%q' "$sample"
  printf '}\n'
else
  ok "Smoke test complete."
fi