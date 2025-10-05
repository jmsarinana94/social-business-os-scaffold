#!/usr/bin/env bash
# Seed multiple demo products and inventories.
# Re-runnable & idempotent: if a product already exists by SKU, it won't create a duplicate.

set -euo pipefail

# --- Config (override via env) ---
API="${API:-http://localhost:4001/v1}"
# IMPORTANT: this is the **Organization ID**, not the slug. From your setup it's org_demo.
ORG="${ORG:-org_demo}"
EMAIL="${EMAIL:-you@example.com}"
PASS="${PASS:-test1234}"

echo "API=$API"
echo "ORG=$ORG  (must be an Organization *id*, e.g. org_demo)"
echo "EMAIL=$EMAIL"

# --- Login (API returns .access_token) ---
TOKEN="$(
  curl -sS -X POST "$API/auth/login" \
    -H 'content-type: application/json' \
    -H "x-org-id: $ORG" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | jq -r '.access_token // .token'
)"

if [[ -z "${TOKEN:-}" || "$TOKEN" == "null" ]]; then
  echo "❌ Unable to get access token. Check ORG/EMAIL/PASS."
  exit 1
fi
echo "✅ Logged in (token acquired)"

# --- Helpers ---
create_or_get_product_id () {
  local title="$1" sku="$2" price="$3" type="$4" status="$5"

  # Try to create
  local create_json
  create_json="$(
    curl -sS -X POST "$API/products" \
      -H 'content-type: application/json' \
      -H "authorization: Bearer $TOKEN" \
      -H "x-org-id: $ORG" \
      -d "$(jq -n --arg t "$title" --arg s "$sku" --argjson p "$price" --arg ty "$type" --arg st "$status" \
        '{title:$t, sku:$s, price:$p, type:$ty, status:$st}')"
  )"

  local pid
  pid="$(jq -r '.id // empty' <<<"$create_json")"
  if [[ -n "$pid" ]]; then
    echo "$pid"
    return 0
  fi

  # If create failed (e.g., already exists), fetch list and pick by SKU
  pid="$(
    curl -sS "$API/products" \
      -H "authorization: Bearer $TOKEN" \
      -H "x-org-id: $ORG" \
    | jq -r --arg sku "$sku" '.data[] | select(.sku==$sku) | .id' | head -n1
  )"

  if [[ -n "$pid" ]]; then
    echo "$pid"
    return 0
  fi

  echo "❌ Failed to create or find product with SKU=$sku" >&2
  echo "" # empty to signal failure
  return 1
}

adjust_inventory () {
  local pid="$1" delta="$2"
  curl -sS -X POST "$API/products/$pid/inventory" \
    -H 'content-type: application/json' \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" \
    -d "$(jq -n --argjson d "$delta" '{delta:$d}')" \
  | jq -r '.inventoryQty // .message // "ok"'
}

verify_inventory () {
  local pid="$1"
  curl -sS "$API/products/$pid/inventory" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" \
  | jq .
}

# --- Catalog to seed ---
# Feel free to edit or extend.
PRODUCTS_JSON='
[
  {"title":"Blue Mug",      "sku":"MUG-BLUE",   "price":12.50, "type":"PHYSICAL", "status":"ACTIVE", "delta":25},
  {"title":"Red Mug",       "sku":"MUG-RED",    "price":11.00, "type":"PHYSICAL", "status":"ACTIVE", "delta":15},
  {"title":"Canvas Tote",   "sku":"TOTE-CANV",  "price":18.00, "type":"PHYSICAL", "status":"ACTIVE", "delta":20},
  {"title":"Gift Card $25", "sku":"GC-25",      "price":25.00, "type":"DIGITAL",  "status":"ACTIVE", "delta":0},
  {"title":"E-Book: Guide", "sku":"EBOOK-GUIDE","price":9.99,  "type":"DIGITAL",  "status":"ACTIVE", "delta":0}
]
'

echo
echo "🚀 Seeding products…"
echo

# --- Loop over products ---
idx=0
echo "$PRODUCTS_JSON" | jq -c '.[]' | while read -r item; do
  idx=$((idx+1))
  title="$(jq -r '.title'  <<<"$item")"
  sku="$(jq   -r '.sku'    <<<"$item")"
  price="$(jq -r '.price'  <<<"$item")"
  type="$(jq  -r '.type'   <<<"$item")"     # Must be UPPERCASE (PHYSICAL/DIGITAL)
  status="$(jq -r '.status'<<<"$item")"     # Must be UPPERCASE (ACTIVE/INACTIVE)
  delta="$(jq -r '.delta'  <<<"$item")"

  echo "[$idx] $title  (SKU=$sku, price=$price, type=$type, status=$status, delta=$delta)"

  pid="$(create_or_get_product_id "$title" "$sku" "$price" "$type" "$status" || true)"
  if [[ -z "$pid" ]]; then
    echo "   ↳ ❌ Skipping (no id)"
    continue
  fi
  echo "   ↳ id=$pid"

  if [[ "$delta" != "0" ]]; then
    new_qty="$(adjust_inventory "$pid" "$delta")"
    echo "   ↳ inventory += $delta → $new_qty"
  else
    echo "   ↳ no inventory change (delta=0)"
  fi

  echo "   ↳ verify:"
  verify_inventory "$pid" | sed 's/^/      /'
  echo
done

echo "✅ Done. Current products:"
curl -sS "$API/products" \
  -H "authorization: Bearer $TOKEN" \
  -H "x-org-id: $ORG" | jq .