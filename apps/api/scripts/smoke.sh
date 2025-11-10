#!/usr/bin/env bash
# apps/api/scripts/smoke.sh
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
  --ci          CI-friendly (waits for /health; no prompts).
  --seed N      Create N demo products after the smoke flow.

Environment:
  API_BASE      Base URL for API (e.g., http://127.0.0.1:4010)
  ORG_SLUG      Tenant slug (default: demo-9bsfct)
  API_EMAIL     Email for signup/login (default: owner@example.com)
  API_PASS      Password for signup/login (default: secret123)
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
  # Default to local Nest port; keep path-less base (endpoints are /auth, /health).
  echo "http://127.0.0.1:4010"
}

BASE="$(discover_base)"
# normalize: strip trailing slash if present
BASE="${BASE%/}"
ENV_HINT="${NODE_ENV:-local}"
info "Using BASE=${BASE} ENV=${ENV_HINT}"

# If --ci, wait up to 30s for /health to go green
if [[ "$FLAG_CI" -eq 1 ]]; then
  for i in {1..30}; do
    if curl -sSf -m 2 "${BASE}/health" >/dev/null 2>&1; then
      ok "Health endpoint reachable"
      break
    fi
    [[ $i -eq 30 ]] && { err "Health check failed after 30s"; exit 1; }
    sleep 1
  done
else
  # Non-fatal quick check
  if curl -sSf -m 2 "${BASE}/health" >/dev/null 2>&1; then
    ok "Health endpoint reachable"
  else
    warn "Health check failed or missing; continuing…"
  fi
fi

# -----------------------------
# HTTP helpers
# -----------------------------
TOKEN=""
ORG_SLUG="${ORG_SLUG:-demo-9bsfct}"  # default seeded tenant slug

have_cmd() { command -v "$1" >/dev/null 2>&1; }

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

extract_json_field() {
  # Usage: extract_json_field '{"a":1,"b":"x"}' 'b'
  local json="$1" key="$2"
  if have_cmd jq; then
    echo "$json" | jq -r --arg k "$key" '.[$k] // empty' 2>/dev/null || true
  else
    # lenient fallback for flat keys like "token"
    echo "$json" | sed -nE "s/.*\"$key\":\"?([^\",}]+).*/\1/p" | head -n1
  fi
}

# -----------------------------
# Auth flow
# -----------------------------
USER_EMAIL="${API_EMAIL:-owner@example.com}"
USER_PASS="${API_PASS:-secret123}"
USER_ORG="$ORG_SLUG"

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
  # Send X-Org for multi-tenant routes
  http_post_json "${BASE}/auth/signup" "$signup_body" -H "X-Org: ${ORG_SLUG}" >/dev/null 2>&1 || true

  res="$(http_post_json "${BASE}/auth/login" "$login_body" -H "X-Org: ${ORG_SLUG}")"
  TOKEN="$(extract_json_field "$res" "token" || true)"
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
# Ensure org exists
# -----------------------------
ensure_org() {
  http_auth_post_json "${BASE}/orgs" "{\"slug\":\"${ORG_SLUG}\",\"name\":\"Demo Org\"}" >/dev/null 2>&1 || true
  http_auth_get "${BASE}/orgs/${ORG_SLUG}"
}

ORG_JSON="$(ensure_org)"
if [[ -z "$ORG_JSON" ]]; then
  err "Could not ensure/fetch org '${ORG_SLUG}'"
  [[ "$FLAG_JSON" -eq 1 ]] && echo '{"ok":false,"error":"org_failed"}'
  exit 1
fi
[[ "$FLAG_JSON" -eq 0 ]] && echo "🏢 ${ORG_JSON}"

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
    PROD_ID="$(extract_json_field "$PROD_JSON" "id" || true)"
    ok "Product created: ${PROD_ID:-unknown}"
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
# Increment inventory
# -----------------------------
increment_inventory_if_possible() {
  local last_id
  # attempt to grab the last SMOKE product id
  last_id="$(echo "$LIST_JSON" | tr -d '\n' | sed -nE 's/.*\{"id":"([^"]+)","sku":"SMOKE-[^"]+".*/\1/p' | tail -n1)"
  [[ -z "$last_id" ]] && return 0
  local url="${BASE}/products/${last_id}/inventory"
  local body='{"delta":5}'
  http_auth_post_json "$url" "$body"
}

INV_JSON="$(increment_inventory_if_possible || true)"
if [[ "$FLAG_JSON" -eq 0 && -n "$INV_JSON" ]]; then
  echo "📈 Inventory +5"
  echo "$INV_JSON"
fi

# -----------------------------
# Optional seeding
# -----------------------------
seed_products() {
  local n="$1"
  [[ "$n" -gt 0 ]] || return 0
  local i
  for ((i=1; i<=n; i++)); do
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
  count="$(echo "$LIST_JSON" | grep -o '"title":"' | wc -l | tr -d ' ' || true)"
  sample="$(echo "$LIST_JSON" | sed -n '1,200p' || true)"
  printf '{'
  printf '"ok":true,"base":%q,' "$BASE"
  printf '"org":%q,' "$ORG_SLUG"
  printf '"products":%s,' "${count:-0}"
  printf '"sample":%q' "$sample"
  printf '}\n'
else
  ok "Smoke test complete for org=${ORG_SLUG}"
fi