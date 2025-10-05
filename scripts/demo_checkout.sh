#!/usr/bin/env bash
set -euo pipefail

API="${API:-http://localhost:4001/v1}"
ORG="${ORG:-org_demo}"          # must be the Organization *id*, e.g. org_demo
EMAIL="${EMAIL:-you@example.com}"
PASS="${PASS:-test1234}"

echo "API=$API"
echo "ORG=$ORG (must be an Organization *id*)"
echo "EMAIL=$EMAIL"

# Acquire token
TOKEN=$(curl -sS -X POST "$API/auth/login" \
  -H 'content-type: application/json' \
  -H "x-org-id: $ORG" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | jq -r '.access_token // .token')

if [[ -z "${TOKEN}" || "${TOKEN}" == "null" ]]; then
  echo "❌ Failed to acquire token"; exit 1
fi
echo "✅ Logged in"

# Ensure products exist (seed if empty)
COUNT=$(curl -sS "$API/products" \
  -H "authorization: Bearer $TOKEN" \
  -H "x-org-id: $ORG" | jq -r '.data | length')

if [[ "$COUNT" == "0" ]]; then
  echo "Seeding demo products first…"
  if [[ ! -x "./scripts/demo_seed.sh" ]]; then
    echo "❌ scripts/demo_seed.sh not found or not executable"; exit 1
  fi
  ./scripts/demo_seed.sh
fi

# Get product ids for blue + red mugs
BLUE=$(curl -sS "$API/products" \
  -H "authorization: Bearer $TOKEN" \
  -H "x-org-id: $ORG" \
  | jq -r '.data[] | select(.sku=="MUG-BLUE").id // empty')

RED=$(curl -sS "$API/products" \
  -H "authorization: Bearer $TOKEN" \
  -H "x-org-id: $ORG" \
  | jq -r '.data[] | select(.sku=="MUG-RED").id // empty')

if [[ -z "$BLUE" || -z "$RED" ]]; then
  echo "❌ Could not find MUG-BLUE or MUG-RED; run scripts/demo_seed.sh"; exit 1
fi

echo "Creating order (2x blue, 1x red)…"
ORDER=$(
  curl -sS -X POST "$API/orders" \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $TOKEN" \
  -H "x-org-id: $ORG" \
  -d "{\"items\":[{\"productId\":\"$BLUE\",\"qty\":2},{\"productId\":\"$RED\",\"qty\":1}]}"
)
echo "$ORDER" | jq .

OID=$(echo "$ORDER" | jq -r '.id // empty')
if [[ -n "$OID" ]]; then
  echo
  echo "GET /orders/$OID"
  curl -sS "$API/orders/$OID" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" | jq .
  echo
  echo "Orders list:"
  curl -sS "$API/orders" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" | jq .
fi