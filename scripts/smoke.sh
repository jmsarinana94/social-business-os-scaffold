#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${BASE:-http://localhost:4010/v1}"
ORG="${ORG:-demo}"
export ORG

echo "== Using =="
echo "BASE=$BASE"
echo "ORG=$ORG"
echo

section () { echo; echo "== $* =="; }

section "Health"
curl -s "$BASE/health" | jq . || true

section "Login"
LOGIN_JSON=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tester@example.com","password":"Passw0rd!demo"}')
echo "$LOGIN_JSON" | jq .
TOKEN=$(echo "$LOGIN_JSON" | jq -r '.access_token // .token // empty')
if [ -z "$TOKEN" ]; then echo "No token found in login response; aborting."; exit 1; fi
echo "TOKEN length: ${#TOKEN}"

section "Ensure product TEE-001"
LIST_STATUS=$(curl -s -o /tmp/prods.json -w "%{http_code}" "$BASE/products" -H "Authorization: Bearer $TOKEN")
echo "GET /products status: $LIST_STATUS"
cat /tmp/prods.json | head -c 400; echo
if [ "$LIST_STATUS" -ge 400 ]; then
  echo "Listing products failed; attempting create…"
fi

PID=$(jq -r '.[] | select(.sku=="TEE-001") | .id' /tmp/prods.json 2>/dev/null | head -n1 || true)
if [ -z "${PID:-}" ] || [ "$PID" = "null" ]; then
  CREATE_STATUS=$(curl -s -o /tmp/create.json -w "%{http_code}" -X POST "$BASE/products" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"title":"Sample Tee","sku":"TEE-001","type":"physical","status":"active","price":1999}')
  echo "POST /products status: $CREATE_STATUS"
  cat /tmp/create.json | jq .
  PID=$(jq -r '.id // empty' /tmp/create.json)
fi
if [ -z "$PID" ]; then echo "Could not obtain product id; aborting."; exit 1; fi
echo "PID=$PID"

section "Adjust inventory +10"
curl -s -X POST "$BASE/products/$PID/inventory" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"delta":10,"reason":"initial stock"}' | jq .

section "Create order"
ORDER_JSON=$(curl -s -X POST "$BASE/orders" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"items\":[{\"productId\":\"$PID\",\"quantity\":1,\"unitPrice\":1999}],\"currency\":\"USD\",\"customerEmail\":\"customer@example.com\"}")
echo "$ORDER_JSON" | jq .

section "Product"
curl -s "$BASE/products/$PID" -H "Authorization: Bearer $TOKEN" | jq .

section "Orders"
curl -s "$BASE/orders" -H "Authorization: Bearer $TOKEN" | jq .

echo
echo "✅ Smoke test complete."