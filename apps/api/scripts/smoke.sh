#!/usr/bin/env bash
# apps/api/scripts/smoke.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="${EMAIL:-me@example.com}"
PASSWORD="${PASSWORD:-secret123}"

echo "🔐 Login (or signup fallback)…"
TOKEN="$(curl -sS -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r .access_token || true)"

if [ -z "${TOKEN:-}" ] || [ "$TOKEN" = "null" ]; then
  echo "No token, trying signup…"
  curl -sS -X POST "$BASE_URL/auth/signup" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null
  TOKEN="$(curl -sS -X POST "$BASE_URL/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r .access_token)"
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to obtain JWT"; exit 1
fi
echo "✅ JWT ok"

ORG="acme-$(date +%s)"
echo "🏢 Create org: $ORG"
ORG_JSON="$(curl -sS -X POST "$BASE_URL/orgs" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"slug\":\"$ORG\",\"name\":\"Acme Inc\"}")"
echo "$ORG_JSON" | jq -e .id >/dev/null || { echo "❌ Org create failed"; exit 1; }
echo "✅ Org created"

echo "🏷️  Create category"
CAT_ID="$(curl -sS -X POST "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Org: $ORG" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Hats"}' | jq -r .id)"
[ "$CAT_ID" != "null" ] && [ -n "$CAT_ID" ] || { echo "❌ Category create failed"; exit 1; }
echo "✅ Category: $CAT_ID"

SKU="CAP-$(date +%s)"
echo "🧢 Create product with category"
PROD_ID="$(curl -sS -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Org: $ORG" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Cap\",\"sku\":\"$SKU\",\"type\":\"PHYSICAL\",\"status\":\"ACTIVE\",\"price\":\"19.99\",\"categoryId\":\"$CAT_ID\"}" \
  | jq -r .id)"
[ "$PROD_ID" != "null" ] && [ -n "$PROD_ID" ] || { echo "❌ Product create failed"; exit 1; }
echo "✅ Product: $PROD_ID"

echo "📦 +5 inventory"
INV="$(curl -sS -X POST "$BASE_URL/products/$PROD_ID/inventory" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Org: $ORG" \
  -H 'Content-Type: application/json' \
  -d '{"delta":5}' | jq -r .inventoryQty)"
[ "$INV" = "5" ] || { echo "❌ Inventory not 5"; exit 1; }
echo "✅ Inventory now: $INV"

echo "🧹 Clear category"
UPDATED_CAT="$(curl -sS -X PUT "$BASE_URL/products/$PROD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Org: $ORG" \
  -H 'Content-Type: application/json' \
  -d '{"categoryId":null}' | jq -r .categoryId)"
[ "$UPDATED_CAT" = "null" ] || { echo "❌ Category not cleared"; exit 1; }
echo "✅ Category cleared"

echo "🎉 Smoke OK"