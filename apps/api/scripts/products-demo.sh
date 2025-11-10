#!/usr/bin/env bash
set -euo pipefail

# ==============================================
# Products Demo (Prism mock-aligned)
# 1) signup
# 2) login
# 3) create product
# 4) list
# 5) get by id
# 6) adjust inventory (+5)
# 7) negative overshoot (400)
# 8) delete
# 9) confirm 404
# ==============================================

BASE="${BASE:-http://127.0.0.1:4010}"
ORG="${ORG:-demo}"
EMAIL="${API_EMAIL:-tester@example.com}"
PASS="${API_PASS:-password123}"

# Product fields as required by the mock spec
SKU="${SKU:-ABC-001}"
TITLE="${TITLE:-Hoodie}"
TYPE="${TYPE:-PHYSICAL}"     # PHYSICAL | SERVICE (per mock)
STATUS="${STATUS:-ACTIVE}"   # ACTIVE | INACTIVE  (per mock)
PRICE="${PRICE:-39.99}"
INV_QTY="${INV_QTY:-12}"

jq_present() { command -v jq >/dev/null 2>&1; }
json() { jq -r "$@" 2>/dev/null || true; }

build_auth_array() {
  local token="$1"
  AUTH=(-H "Authorization: Bearer ${token}" -H "X-Org: ${ORG}")
}

echo "1) signup -> 201"
curl -sS -X POST "$BASE/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | (jq_present && jq . || cat)

echo "2) login -> 200 (capture TOKEN)"
LOGIN_JSON="$(curl -sS -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")"
echo "$LOGIN_JSON" | (jq_present && jq . || cat)
TOKEN="$(echo "$LOGIN_JSON" | json '.token // "ey.mock.jwt.token"')"
build_auth_array "$TOKEN"
echo "TOKEN=${TOKEN:0:10}…"

echo "3) create product -> 201 (capture PROD_ID)"
CREATE_JSON="$(curl -sS -X POST "$BASE/products" \
  "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d "{\"sku\":\"$SKU\",\"title\":\"$TITLE\",\"type\":\"$TYPE\",\"status\":\"$STATUS\",\"price\":$PRICE,\"inventoryQty\":$INV_QTY}")"
echo "$CREATE_JSON" | (jq_present && jq . || cat)
PROD_ID="$(echo "$CREATE_JSON" | json '.id // "prod_1"')"
echo "PROD_ID=$PROD_ID"

echo "4) list -> 200 (array)"
curl -sS "$BASE/products" "${AUTH[@]}" | (jq_present && jq . || cat)

echo "5) get by id -> 200"
curl -sS "$BASE/products/$PROD_ID" "${AUTH[@]}" | (jq_present && jq . || cat)

echo "6) adjust inventory +5 -> 200"
curl -sS -X POST "$BASE/products/$PROD_ID/inventory" \
  "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"delta":5}' | (jq_present && jq . || cat)

echo "7) attempt negative overshoot -> expect 400"
curl -sS -X POST "$BASE/products/$PROD_ID/inventory" \
  "${AUTH[@]}" -H 'Content-Type: application/json' \
  -H 'Prefer: code=400' \
  -d '{"delta":-999}' | (jq_present && jq . || cat)

echo "8) delete -> 204"
curl -sS -X DELETE "$BASE/products/$PROD_ID" \
  "${AUTH[@]}" -o /dev/null -w "DELETE -> %{http_code}\n"

echo "9) confirm 404 after delete"
curl -sS "$BASE/products/$PROD_ID" \
  "${AUTH[@]}" -H 'Prefer: code=404' | (jq_present && jq . || cat)