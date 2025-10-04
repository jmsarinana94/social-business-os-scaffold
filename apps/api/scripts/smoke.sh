#!/usr/bin/env bash
set -Eeuo pipefail

# ===== Config =====
BASE="${BASE:-http://localhost:4010/v1}"
ORG="${ORG:-demo}"   # used by the API service to resolve org by slug
export ORG

echo "== Using =="
echo "BASE=$BASE"
echo "ORG=$ORG"
echo

# Small helper for pretty sections
section () { echo; echo "== $* =="; }

# 1) Health
section "Health"
curl --fail -s "$BASE/health" | jq .

# 2) Login
section "Login"
LOGIN_JSON=$(curl --fail -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tester@example.com","password":"Passw0rd!demo"}')
echo "$LOGIN_JSON" | jq .
TOKEN=$(echo "$LOGIN_JSON" | jq -r '.access_token // .token // empty')
if [ -z "$TOKEN" ]; then
  echo "No token found in login response; aborting."
  exit 1
fi
echo "TOKEN length: ${#TOKEN}"

# 3) Ensure product with SKU TEE-001
section "Ensure product TEE-001"
PRODUCTS_JSON=$(curl --fail -s "$BASE/products" -H "Authorization: Bearer $TOKEN")
PID=$(echo "$PRODUCTS_JSON" | jq -r '.[] | select(.sku=="TEE-001") | .id' | head -n1 || true)

if [ -z "${PID:-}" ] || [ "$PID" = "null" ]; then
  echo "Creating TEE-001…"
  CREATE_JSON=$(curl --fail -s -X POST "$BASE/products" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"title":"Sample Tee","sku":"TEE-001","type":"physical","status":"active","price":1999}')
  echo "$CREATE_JSON" | jq .
  PID=$(echo "$CREATE_JSON" | jq -r '.id // empty')
fi

if [ -z "$PID" ]; then
  echo "Could not obtain product id. Dumping /products:"
  echo "$PRODUCTS_JSON" | jq .
  exit 1
fi
echo "PID=$PID"

# 4) Adjust inventory
section "Adjust inventory +10"
curl --fail -s -X POST "$BASE/products/$PID/inventory" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"delta":10,"reason":"initial stock"}' | jq .

# 5) Create order
section "Create order"
ORDER_JSON=$(curl --fail -s -X POST "$BASE/orders" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"items\":[{\"productId\":\"$PID\",\"quantity\":1,\"unitPrice\":1999}],\"currency\":\"USD\",\"customerEmail\":\"customer@example.com\"}")
echo "$ORDER_JSON" | jq .

# 6) Sanity checks
section "Product"
curl --fail -s "$BASE/products/$PID" -H "Authorization: Bearer $TOKEN" | jq .

section "Orders"
curl --fail -s "$BASE/orders" -H "Authorization: Bearer $TOKEN" | jq .

echo
echo "✅ Smoke test complete."
