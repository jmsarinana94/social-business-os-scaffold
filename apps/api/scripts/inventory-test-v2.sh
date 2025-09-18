#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:4000}"
ORG="${ORG:-demo}"

# login
TOKEN="$(
  curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"tester@example.com","password":"secret123"}' \
  | jq -r '.access_token // .token'
)"
[[ -z "$TOKEN" || "$TOKEN" == "null" ]] && { echo "Failed to get token"; exit 1; }

# create product to test against
NEW_JSON="$(
  curl -s -X POST "$BASE/products" \
    -H "x-org: $ORG" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Inv Test","type":"PHYSICAL","status":"ACTIVE","sku":"SKU-INV-'"$RANDOM"'","price":9.99}'
)"
PRODUCT_ID="$(echo "$NEW_JSON" | jq -r '.id')"
if [[ -z "$PRODUCT_ID" || "$PRODUCT_ID" == "null" ]]; then
  echo "Could not create product:"
  echo "$NEW_JSON" | jq .
  exit 1
fi

echo "✓ TOKEN: ${TOKEN:0:20}…"
echo "✓ PRODUCT_ID: $PRODUCT_ID"

echo "→ +5 (expect 200 OK)"
curl -s -X POST "$BASE/products/$PRODUCT_ID/inventory" \
  -H "x-org: $ORG" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delta":5}' | jq .

echo "→ overshoot -99999 (expect 400 Bad Request)"
curl -i -s -X POST "$BASE/products/$PRODUCT_ID/inventory" \
  -H "x-org: $ORG" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delta":-99999}' | head -n 20

echo "→ product after adjustments"
curl -s "$BASE/products/$PRODUCT_ID" -H "x-org: $ORG" | jq .