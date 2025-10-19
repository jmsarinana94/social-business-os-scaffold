#!/usr/bin/env bash
# Robust, zsh-safe (no history expansion), end-to-end flow:
# - login
# - create/reuse product (decimal price)
# - inventory +10
# - create order (decimal unitPrice)
# - sanity printouts

set -uo pipefail
# If sourced from zsh, disable '!' history expansion:
if [ -n "${ZSH_VERSION-}" ]; then
  setopt NO_BANG_HIST 2>/dev/null || true
fi

BASE="${BASE:-http://localhost:4010/v1}"
EMAIL="${EMAIL:-tester@example.com}"
PASS="${PASS:-Passw0rd!demo}"
SKU="${SKU:-TEE-001}"
PRICE="${PRICE:-19.99}"
QTY="${QTY:-1}"

echo "== Config =="; echo "BASE=$BASE"; echo

echo "== Health =="
curl -sS -o /tmp/health.json -w "HTTP %{http_code}\n" "$BASE/health" || true
cat /tmp/health.json; echo

echo "== Login =="
LOGIN_JSON=$(curl -sS -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"tester@example.com","password":"Passw0rd!demo"}' || true)
echo "$LOGIN_JSON" | jq . 2>/dev/null || echo "$LOGIN_JSON"
TOKEN=$(echo "$LOGIN_JSON" | jq -r '.access_token // .token // empty' 2>/dev/null || echo "")
echo "TOKEN length: ${#TOKEN}"
[ -n "$TOKEN" ] || { echo "❌ Login failed"; exit 1; }
echo

echo "== Ensure product ($SKU) =="
CREATE_JSON=$(curl -sS -X POST "$BASE/products" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"title\":\"Sample Tee\",\"sku\":\"$SKU\",\"type\":\"PHYSICAL\",\"status\":\"ACTIVE\",\"price\":$PRICE}" || true)
PID=$(echo "$CREATE_JSON" | jq -r '.id // empty' 2>/dev/null || echo "")
if [ -z "$PID" ] || [ "$PID" = "null" ]; then
  # probably already exists; fetch by SKU
  LIST_JSON=$(curl -sS "$BASE/products" -H "Authorization: Bearer $TOKEN" || true)
  PID=$(echo "$LIST_JSON" | jq -r ".[] | select(.sku==\"$SKU\") | .id" 2>/dev/null | head -n1 || echo "")
fi
echo "PID=$PID"
[ -n "$PID" ] || { echo "❌ Could not get PID"; echo "$CREATE_JSON" | jq .; exit 1; }
echo

echo "== Inventory +10 =="
curl -sS -X POST "$BASE/products/$PID/inventory" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"delta":10,"reason":"initial stock"}' | jq . 2>/dev/null || true
echo

echo "== Create order =="
ORDER_JSON=$(curl -sS -X POST "$BASE/orders" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"items\":[{\"productId\":\"$PID\",\"quantity\":$QTY,\"unitPrice\":$PRICE}],\"currency\":\"USD\",\"customerEmail\":\"customer@example.com\"}" || true)
echo "$ORDER_JSON" | jq . 2>/dev/null || echo "$ORDER_JSON"
echo

echo "== Product =="
curl -sS "$BASE/products/$PID" -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || true
echo

echo "== Orders =="
curl -sS "$BASE/orders" -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || true
echo

echo "✅ Done."
