#!/usr/bin/env bash
set -euo pipefail

# -------- Config (overridable via env) --------
BASE="${BASE:-http://localhost:4000}"
API_PREFIX="${API_PREFIX:-/v1}"
ORG="${ORG:-demo}"
EMAIL="${EMAIL:-tester@example.com}"
PASSWORD="${PASSWORD:-secret123}"

BASE_API="${BASE%/}${API_PREFIX}"

# -------- Helpers --------
GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
say() { echo -e "${YELLOW}→${NC} $*"; }
ok()  { echo -e "${GREEN}✓${NC} $*"; }
fail(){ echo -e "${RED}✗${NC} $*"; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || fail "Missing required tool '$1'"; }

need curl; need jq

say "Checking API health at ${BASE_API}/health"
if curl -fsS "${BASE_API}/health" >/dev/null 2>&1; then ok "API /health responded"; else say "Health check failed (non-fatal). Continuing…"; fi

say "Logging in as ${EMAIL}"
TOKEN="$(
  curl -s -X POST "${BASE_API}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" \
  | jq -r '.access_token // .token // empty'
)"
[[ -z "${TOKEN}" || "${TOKEN}" == "null" ]] && fail "Failed to get token"; ok "TOKEN: ${TOKEN:0:20}…"

say "Probing products list with auth to verify routing & org"
LIST_RES="$(curl -s "${BASE_API}/products" -H "x-org: ${ORG}" -H "Authorization: Bearer ${TOKEN}")"
if ! echo "$LIST_RES" | jq -e '.data' >/dev/null 2>&1; then
  echo "$LIST_RES" | jq . || true
  fail "Products list did not return expected shape. Check x-org header & version prefix."
fi
ok "Products list reachable (items: $(echo "$LIST_RES" | jq '.data | length'))"

if [[ "${PRODUCT_ID:-}" != "" && "${PRODUCT_ID}" != "null" ]]; then
  ok "Using PRODUCT_ID from env: ${PRODUCT_ID}"
else
  say "No PRODUCT_ID provided. Creating a temporary product…"
  SKU="SKU-INV-$(date +%s%N)"
  CREATE_RES="$(
    curl -s -i -X POST "${BASE_API}/products" \
      -H "x-org: ${ORG}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"title\":\"Inv Test\",\"type\":\"PHYSICAL\",\"status\":\"ACTIVE\",\"sku\":\"${SKU}\",\"price\":1}"
  )"
  echo "$CREATE_RES" | sed -n '1,20p' >&2
  STATUS="$(echo "$CREATE_RES" | head -n 1 | awk '{print $2}')"
  BODY="$(echo "$CREATE_RES" | sed -n 's/^[[:alpha:]-]*:.*$//p' | tail -n +2)"
  PRODUCT_ID="$(echo "$BODY" | jq -r '.id // .data.id // empty')"
  if [[ "$STATUS" != "201" ]]; then
    echo "$BODY" | jq . >&2
    fail "Create failed with HTTP $STATUS"
  fi
  [[ -z "$PRODUCT_ID" ]] && { echo "$BODY" | jq . >&2; fail "Create succeeded but no id in body"; }
  ok "Created product ${PRODUCT_ID} (sku=${SKU})"
fi

say "+5 inventory (expect 200 OK)"
PLUS_RES="$(
  curl -s -i -X POST "${BASE_API}/products/${PRODUCT_ID}/inventory" \
    -H "x-org: ${ORG}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"delta":5}'
)"
PLUS_STATUS="$(echo "${PLUS_RES}" | head -n 1 | awk '{print $2}')"
[[ "${PLUS_STATUS}" != "200" ]] && { echo "${PLUS_RES}" | sed -n '1,120p'; fail "Expected 200 on +5, got ${PLUS_STATUS}"; }
ok "+5 OK"

say "Overshoot -99999 (expect 400 Bad Request)"
OVER_RES="$(
  curl -s -i -X POST "${BASE_API}/products/${PRODUCT_ID}/inventory" \
    -H "x-org: ${ORG}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"delta":-99999}'
)"
OVER_STATUS="$(echo "${OVER_RES}" | head -n 1 | awk '{print $2}')"
[[ "${OVER_STATUS}" != "400" ]] && { echo "${OVER_RES}" | sed -n '1,120p'; fail "Expected 400 on overshoot, got ${OVER_STATUS}"; }
ok "Overshoot correctly rejected with 400"

say "Product after adjustments"
curl -s "${BASE_API}/products/${PRODUCT_ID}" -H "x-org: ${ORG}" -H "Authorization: Bearer ${TOKEN}" | jq .

ok "Done."