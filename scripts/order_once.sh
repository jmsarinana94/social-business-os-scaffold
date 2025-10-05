#!/usr/bin/env bash
set -euo pipefail

# --- config (self-contained) ---
BASE="${BASE:-http://localhost:4010/v1}"
EMAIL="${EMAIL:-tester@example.com}"
PASS="${PASS:-Passw0rd!demo}"
SKU="${SKU:-TEE-001}"
PRICE="${PRICE:-1999}"         # cents for unitPrice
QTY="${QTY:-1}"

echo "BASE=$BASE"

# --- login to get TOKEN ---
LOGIN_JSON=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(echo "$LOGIN_JSON" | jq -r '.access_token // .token // empty')
if [[ -z "$TOKEN" ]]; then
  echo "❌ Could not obtain token. Response:"
  echo "$LOGIN_JSON"
  exit 1
fi
echo "TOKEN length: ${#TOKEN}"

# --- ensure product exists; capture PID ---
PRODUCTS_JSON=$(curl -s "$BASE/products" -H "Authorization: Bearer $TOKEN")
PID=$(echo "$PRODUCTS_JSON" | jq -r ".[] | select(.sku==\"$SKU\") | .id" | head -n1 || true)

if [[ -z "${PID:-}" || "$PID" == "null" ]]; then
  echo "Creating product $SKU ..."
  CREATE_JSON=$(curl -s -X POST "$BASE/products" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"title\":\"Sample Tee\",\"sku\":\"$SKU\",\"type\":\"physical\",\"status\":\"active\",\"price\":$PRICE}")
  echo "$CREATE_JSON" | jq .
  PID=$(echo "$CREATE_JSON" | jq -r '.id // empty')
fi

if [[ -z "${PID:-}" ]]; then
  echo "❌ Failed to get product id (PID)."
  exit 1
fi
echo "PID=$PID"

# --- adjust inventory +10 (ok if it was already sufficient) ---
echo "Adjusting inventory..."
curl -s -X POST "$BASE/products/$PID/inventory" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"delta":10,"reason":"initial stock"}' | jq .

# --- create order ---
echo "Creating order..."
ORDER_JSON=$(curl -s -X POST "$BASE/orders" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"items\":[{\"productId\":\"$PID\",\"quantity\":$QTY,\"unitPrice\":$PRICE}],\"currency\":\"USD\",\"customerEmail\":\"customer@example.com\"}")
echo "$ORDER_JSON" | jq .

# --- sanity checks ---
echo "== Product =="
curl -s "$BASE/products/$PID" -H "Authorization: Bearer $TOKEN" | jq .

echo "== Orders =="
curl -s "$BASE/orders" -H "Authorization: Bearer $TOKEN" | jq .

echo "✅ Done."