#!/usr/bin/env bash
# Robust runner: no immediate exit; we print statuses and bodies for each step.
set -uo pipefail

BASE="${BASE:-http://localhost:4010/v1}"
EMAIL="${EMAIL:-tester@example.com}"
PASS="${PASS:-Passw0rd!demo}"
SKU="${SKU:-TEE-001}"
PRICE="${PRICE:-1999}"   # cents
QTY="${QTY:-1}"

echo "== Config =="
echo "BASE=$BASE"
echo "EMAIL=$EMAIL"
echo

echo "== Health =="
curl -sS -o /tmp/health.json -w "HTTP %{http_code}\n" "$BASE/health" || true
cat /tmp/health.json; echo; echo

echo "== Login =="
LOGIN_STATUS=$(curl -sS -o /tmp/login.json -w "%{http_code}" \
  -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}") || true
echo "HTTP $LOGIN_STATUS"
cat /tmp/login.json; echo
TOKEN=$(jq -r '.access_token // .token // empty' /tmp/login.json 2>/dev/null || echo "")
echo "TOKEN length: ${#TOKEN}"
if [ -z "$TOKEN" ]; then
  echo "❌ No token. Aborting early."; exit 1
fi
echo

echo "== List products =="
PROD_LIST_STATUS=$(curl -sS -o /tmp/products.json -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" "$BASE/products") || true
echo "HTTP $PROD_LIST_STATUS"
head -c 400 /tmp/products.json; echo; echo

PID=$(jq -r ".[] | select(.sku==\"$SKU\") | .id" /tmp/products.json 2>/dev/null | head -n1 || true)
if [ -z "${PID:-}" ] || [ "$PID" = "null" ]; then
  echo "== Create product $SKU =="
  CREATE_STATUS=$(curl -sS -o /tmp/create.json -w "%{http_code}" \
    -X POST "$BASE/products" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"title\":\"Sample Tee\",\"sku\":\"$SKU\",\"type\":\"physical\",\"status\":\"active\",\"price\":$PRICE}") || true
  echo "HTTP $CREATE_STATUS"
  cat /tmp/create.json | jq .; echo
  PID=$(jq -r '.id // empty' /tmp/create.json 2>/dev/null || echo "")
fi
if [ -z "$PID" ]; then
  echo "❌ Could not obtain product id (PID). Aborting."; exit 1
fi
echo "PID=$PID"
echo

echo "== Adjust inventory +10 =="
INV_STATUS=$(curl -sS -o /tmp/inv.json -w "%{http_code}" \
  -X POST "$BASE/products/$PID/inventory" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"delta":10,"reason":"initial stock"}') || true
echo "HTTP $INV_STATUS"
cat /tmp/inv.json | jq .; echo

echo "== Create order =="
ORDER_STATUS=$(curl -sS -o /tmp/order.json -w "%{http_code}" \
  -X POST "$BASE/orders" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"items\":[{\"productId\":\"$PID\",\"quantity\":$QTY,\"unitPrice\":$PRICE}],\"currency\":\"USD\",\"customerEmail\":\"customer@example.com\"}") || true
echo "HTTP $ORDER_STATUS"
cat /tmp/order.json | jq .; echo

echo "== Product (final) =="
curl -sS "$BASE/products/$PID" -H "Authorization: Bearer $TOKEN" | jq . || true
echo

echo "== Orders (final) =="
curl -sS "$BASE/orders" -H "Authorization: Bearer $TOKEN" | jq . || true
echo

echo "✅ Done."
