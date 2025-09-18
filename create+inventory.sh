#!/usr/bin/env bash
set -euo pipefail

# --- config (overridable via env) ---
BASE="${BASE:-http://localhost:4000}"
API="${API:-/v1}"
EMAIL="${EMAIL:-tester@example.com}"
PASSWORD="${PASSWORD:-secret123}"
ORG_SLUG="${ORG:-demo}"  # we’ll send x-org: <slug>

echo "BASE=$BASE  API=$API  ORG_SLUG=$ORG_SLUG"

# --- login (or signup fallback) ---
TOKEN="$(
  curl -sS -X POST "$BASE$API/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"'"$EMAIL"'","password":"'"$PASSWORD"'"}' \
  | jq -r '.access_token // .token // empty'
)"
if [ -z "$TOKEN" ]; then
  echo "Login failed; trying signup…"
  TOKEN="$(
    curl -sS -X POST "$BASE$API/auth/signup" \
      -H 'Content-Type: application/json' \
      -d '{"email":"'"$EMAIL"'","password":"'"$PASSWORD"'"}' \
    | jq -r '.access_token // .token // empty'
  )"
fi
[ -n "$TOKEN" ] || { echo "✗ Could not get token"; exit 1; }
echo "✓ TOKEN: ${TOKEN:0:20}…"

# --- sanity ---
echo "→ /auth/me"
curl -sS "$BASE$API/auth/me" -H "Authorization: Bearer $TOKEN" | jq .

# --- build product body safely ---
SKU="SKU-SWAG-$RANDOM"
jq -n --arg sku "$SKU" \
  '{title:"Swagger Tee",type:"PHYSICAL",status:"ACTIVE",sku:$sku,price:19.99}' \
  > /tmp/create.body.json
echo "→ create body:"; cat /tmp/create.body.json; echo

# --- create product (SHOW what we send, including headers) ---
echo "→ creating product (x-org: $ORG_SLUG)"
curl -v -sS -X POST "$BASE$API/products" \
  -H "x-org: $ORG_SLUG" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data @/tmp/create.body.json \
  -D /tmp/create.headers \
  -o /tmp/create.json 2> /tmp/create.curltrace

echo "=== CURL OUTGOING REQUEST (subset) ==="
# Show the exact request headers curl sent
sed -n '/> POST /,/>$/p' /tmp/create.curltrace | sed 's/^/  /'

echo "=== CREATE HEADERS (response) ==="; sed -n '1,120p' /tmp/create.headers
echo "=== CREATE BODY PRETTY ==="; jq . /tmp/create.json 2>/dev/null || cat /tmp/create.json

PID="$(jq -r '.id // empty' </tmp/create.json)"
if [ -z "$PID" ]; then
  echo "✗ No product id returned; creation failed. See trace/headers above."
  exit 1
fi
echo "✓ PID=$PID (SKU=$SKU)"

# --- +5 inventory (should 200) ---
echo "→ +5 inventory"
curl -sS -X POST "$BASE$API/products/$PID/inventory" \
  -H "x-org: $ORG_SLUG" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"delta":5}' | jq '.inventoryQty, .price, (.price|type), .createdAt, .updatedAt'

# --- overshoot (should 400) ---
echo "→ overshoot -99999 (expect 400)"
curl -i -sS -X POST "$BASE$API/products/$PID/inventory" \
  -H "x-org: $ORG_SLUG" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"delta":-99999}' | sed -n '1,40p'
