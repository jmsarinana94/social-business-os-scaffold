#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
ORG="${ORG:-acme}"
BASE="http://localhost:$PORT"

EMAIL="demo+$RANDOM@test.com"
PASS="password123"

echo "→ signup ($EMAIL @ $ORG)"
signup_status=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-Org: $ORG" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"org\":\"$ORG\"}" \
  "$BASE/auth/signup")
echo "   status: $signup_status (201 created is normal; 200 also ok)"

echo "→ login"
TOKEN=$(curl -s "$BASE/auth/login" \
  -H "X-Org: $ORG" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | jq -r '.access_token // .token')
[ -n "${TOKEN:-}" ] && [ "$TOKEN" != "null" ] || { echo "!! no token returned"; exit 1; }
echo "   got JWT"

echo "→ /auth/me"
curl -s "$BASE/auth/me" -H "X-Org: $ORG" -H "Authorization: Bearer $TOKEN" | jq .

echo "→ /orgs/me"
curl -s "$BASE/orgs/me" -H "X-Org: $ORG" | jq .

SKU="SKU-$RANDOM"
echo "→ create product $SKU"
curl -s "$BASE/products" \
  -H "X-Org: $ORG" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"title\":\"Widget\",\"type\":\"PHYSICAL\",\"status\":\"ACTIVE\",\"price\":12.34,\"sku\":\"$SKU\",\"description\":\"Smoke\"}" | jq .

echo "→ list products"
curl -s "$BASE/products" -H "X-Org: $ORG" -H "Authorization: Bearer $TOKEN" | jq '.[0:3]'

echo "✓ done"