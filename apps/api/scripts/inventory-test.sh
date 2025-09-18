#!/usr/bin/env bash
# apps/api/scripts/inventory-test.sh
set -euo pipefail

# ----- config / defaults -----
PORT="${PORT:-4000}"
ORG="${ORG:-demo}"
EMAIL="${API_EMAIL:-tester@example.com}"
PASS="${API_PASS:-secret123}"

# ----- login and get token (safe if already set) -----
if [ -z "${TOKEN:-}" ]; then
  TOKEN="$(
    curl -s -X POST "http://localhost:${PORT}/auth/login" \
      -H 'Content-Type: application/json' \
      -d '{"email":"'"$EMAIL"'","password":"'"$PASS"'"}' \
    | jq -r '.access_token // .token // .accessToken // empty'
  )"
fi

if [ -z "$TOKEN" ]; then
  echo "Login failed: TOKEN empty. Check EMAIL/PASS or server status." >&2
  exit 1
fi
echo "✓ TOKEN acquired: $(echo "$TOKEN" | head -c 20)…"

# ----- find a product id (or create one) -----
PRODUCT_ID="$(
  curl -s "http://localhost:${PORT}/products" -H "x-org: ${ORG}" \
  | jq -r '.data[0].id // empty'
)"

if [ -z "$PRODUCT_ID" ]; then
  echo "No products found; creating one…"
  PRODUCT_ID="$(
    curl -s -X POST "http://localhost:${PORT}/products" \
      -H "x-org: ${ORG}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"title":"Inv Test","type":"PHYSICAL","status":"ACTIVE","sku":"SKU-INV-'"$RANDOM"'","price":1}' \
    | jq -r '.id // empty'
  )"
fi

if [ -z "$PRODUCT_ID" ]; then
  echo "Could not obtain PRODUCT_ID. Abort." >&2
  exit 1
fi
echo "✓ Using PRODUCT_ID: ${PRODUCT_ID}"

# ----- 1) Increase inventory by +5 (expect 200 OK) -----
echo -e "\n→ +5 (expect 200 OK)"
curl -i -X POST "http://localhost:${PORT}/products/${PRODUCT_ID}/inventory" \
  -H "x-org: ${ORG}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"delta":5}' | sed -n '1,40p'

# ----- 2) Overshoot negative (expect 400 Bad Request) -----
echo -e "\n→ overshoot -1000 (expect 400 Bad Request)"
curl -i -X POST "http://localhost:${PORT}/products/${PRODUCT_ID}/inventory" \
  -H "x-org: ${ORG}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"delta":-1000}' | sed -n '1,60p'

# ----- Show the product after the adjustments -----
echo -e "\n→ product after adjustments"
curl -s "http://localhost:${PORT}/products/${PRODUCT_ID}" \
  -H "x-org: ${ORG}" | jq .