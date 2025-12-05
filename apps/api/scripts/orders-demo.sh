#!/usr/bin/env bash
set -euo pipefail

# ==============================================
# Orders Demo (Prism mock–aligned)
# 1) signup/login
# 2) create product (required fields)
# 3) stock +10
# 4) create order (items[].qty and items[].unitPrice as STRING)
# 5) list orders
# (Mock spec does NOT expose GET/DELETE /orders/{id})
# ==============================================

BASE="${BASE:-http://127.0.0.1:4010}"
ORG="${ORG:-demo}"
EMAIL="${API_EMAIL:-tester@example.com}"
PASS="${API_PASS:-password123}"

# Product fields required by mock spec
PROD_SKU="${PROD_SKU:-ORD-001}"
PROD_TITLE="${PROD_TITLE:-Order Widget}"
PROD_TYPE="${PROD_TYPE:-PHYSICAL}"
PROD_STATUS="${PROD_STATUS:-ACTIVE}"
PROD_PRICE="${PROD_PRICE:-49.99}"
PROD_INV_QTY="${PROD_INV_QTY:-10}"

# Order item fields expected by mock spec
ORDER_QTY="${ORDER_QTY:-2}"
# IMPORTANT: unitPrice must be a STRING in the mock (money format)
ORDER_UNIT_PRICE_STR="${ORDER_UNIT_PRICE_STR:-49.99}"

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
CREATE_PROD_JSON="$(curl -sS -X POST "$BASE/products" \
  "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d "{\"sku\":\"$PROD_SKU\",\"title\":\"$PROD_TITLE\",\"type\":\"$PROD_TYPE\",\"status\":\"$PROD_STATUS\",\"price\":$PROD_PRICE,\"inventoryQty\":$PROD_INV_QTY}")"
echo "$CREATE_PROD_JSON" | (jq_present && jq . || cat)
PROD_ID="$(echo "$CREATE_PROD_JSON" | json '.id // "prod_1"')"
echo "PROD_ID=$PROD_ID"

echo "4) stock +10 -> 200"
curl -sS -X POST "$BASE/products/$PROD_ID/inventory" \
  "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"delta":10}' | (jq_present && jq . || cat)

echo "5) create order -> 201"
# unitPrice is quoted as string per the mock
CREATE_ORDER_JSON="$(curl -sS -X POST "$BASE/orders" \
  "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d "{\"items\":[{\"productId\":\"$PROD_ID\",\"qty\":$ORDER_QTY,\"unitPrice\":\"$ORDER_UNIT_PRICE_STR\"}],\"notes\":\"test order\"}")"
echo "$CREATE_ORDER_JSON" | (jq_present && jq . || cat)

echo "6) list orders -> 200"
curl -sS "$BASE/orders" "${AUTH[@]}" | (jq_present && jq . || cat)

echo "Done."