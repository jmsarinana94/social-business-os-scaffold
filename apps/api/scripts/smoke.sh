#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
ORG="${ORG:-demo}"
EMAIL="${API_EMAIL:-tester@example.com}"
PASS="${API_PASS:-secret123}"

echo "→ login"
TOKEN="$(curl -s -X POST "$API_URL/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | jq -r '.access_token // .token')"

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "No token; attempting signup…"
  curl -s -X POST "$API_URL/auth/signup" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"org\":\"$ORG\"}" >/dev/null
  TOKEN="$(curl -s -X POST "$API_URL/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
    | jq -r '.access_token // .token')"
fi

echo "→ /auth/me"
curl -s "$API_URL/auth/me" -H "Authorization: Bearer $TOKEN" | jq .

SKU="SKU-SMOKE-$RANDOM"

echo "→ create product (validation ok)"
curl -s -X POST "$API_URL/products" \
  -H "x-org: $ORG" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"title\":\"Smoke\",\"type\":\"PHYSICAL\",\"sku\":\"$SKU\",\"price\":9.99,\"status\":\"ACTIVE\",\"inventoryQty\":0}" \
  | jq '{id, sku, price, createdAt}'

echo "→ create product missing price (expect 400)"
curl -s -i -X POST "$API_URL/products" \
  -H "x-org: $ORG" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"title\":\"No Price\",\"type\":\"PHYSICAL\",\"sku\":\"$SKU-NO\"}" | sed -n '1,20p'