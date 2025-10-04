#!/usr/bin/env bash
set -euo pipefail

API=${API:-http://localhost:4001/v1}
ORG=${ORG:-org_demo}
EMAIL=${EMAIL:-you@example.com}
PASS=${PASS:-test1234}

echo "API=$API"
echo "ORG=$ORG  (must be an Organization *id*, e.g. org_demo)"
echo "EMAIL=$EMAIL"

# login
TOKEN=$(curl -sS -X POST "$API/auth/login" \
  -H 'content-type: application/json' \
  -H "x-org-id: $ORG" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | jq -r '.access_token // .token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "❌ Failed to acquire token" >&2
  exit 1
fi
echo "✅ Logged in"

# ensure demo products exist (use your existing seed if you like)
echo "Checking products…"
LIST=$(curl -sS "$API/products" -H "authorization: Bearer $TOKEN" -H "x-org-id: $ORG")
COUNT=$(jq -r '.data | length' <<<"$LIST")
if [[ "$COUNT" -eq 0 ]]; then
  echo "No products found. Seeding quick demo set…"
  curl -sS -X POST "$API/products" \
    -H 'content-type: application/json' \
    -H "authorization: Bearer $TOKEN" -H "x-org-id: $ORG" \
    -d '{"title":"Blue Mug","sku":"MUG-BLUE","price":12.50,"type":"PHYSICAL","status":"ACTIVE"}' >/dev/null
  curl -sS -X POST "$API/products/$(curl -sS "$API/products" -H "authorization: Bearer $TOKEN" -H "x-org-id: $ORG" | jq -r '.data[] | select(.sku=="MUG-BLUE").id')/inventory" \
    -H 'content-type: application/json' \
    -H "authorization: Bearer $TOKEN" -H "x-org-id: $ORG" \
    -d '{"delta": 50}' >/dev/null
fi

# Fetch two items to buy
MUG_BLUE_ID=$(curl -sS "$API/products" -H "authorization: Bearer $TOKEN" -H "x-org-id: $ORG" | jq -r '.data[] | select(.sku=="MUG-BLUE").id // empty')
MUG_RED_ID=$(curl -sS "$API/products" -H "authorization: Bearer $TOKEN" -H "x-org-id: $ORG" | jq -r '.data[] | select(.sku=="MUG-RED").id // empty')

echo "Creating order…"
ORDER=$(curl -sS -X POST "$API/orders" \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $TOKEN" -H "x-org-id: $ORG" \
  -d "$(jq -n --arg blue "$MUG_BLUE_ID" --arg red "$MUG_RED_ID" '
        {
          items: [
            { productId: $blue, qty: 2 },
            (if $red != "" then { productId: $red, qty: 1 } else empty end)
          ] | map(select(.productId != null))
        }')" )

echo "$ORDER" | jq .

OID=$(echo "$ORDER" | jq -r '.id')
echo
echo "Order detail:"
curl -sS "$API/orders/$OID" -H "authorization: Bearer $TOKEN" -H "x-org-id: $ORG" | jq .

echo
echo "Orders list:"
curl -sS "$API/orders" -H "authorization: Bearer $TOKEN" -H "x-org-id: $ORG" | jq .