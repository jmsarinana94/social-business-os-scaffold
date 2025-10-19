#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
EMAIL="${EMAIL:-demo+$(date +%s)@example.com}"
PASSWORD="${PASSWORD:-password}"

jq_ok() {
  command -v jq >/dev/null 2>&1
}

if ! jq_ok; then
  echo "jq is required for this script"; exit 1
fi

say() { printf "%s\n" "$*"; }
ok()  { printf "✅ %s\n" "$*"; }
fail(){ printf "❌ %s\n" "$*" 1>&2; exit 1; }

auth_token=""

login() {
  say "🔐 Login (or signup fallback)…"
  # try login first
  if token=$(curl -fsS -X POST "$API_URL/auth/login" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token?'); then
    if [[ "$token" != "null" && -n "$token" ]]; then
      auth_token="$token"
      ok "JWT ok"
      return 0
    fi
  fi

  # fallback to signup
  if token=$(curl -fsS -X POST "$API_URL/auth/signup" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token?'); then
    if [[ "$token" != "null" && -n "$token" ]]; then
      auth_token="$token"
      ok "JWT ok (via signup)"
      return 0
    fi
  fi

  fail "Signup/Login failed"
}

auth_hdr() {
  echo "Authorization: Bearer $auth_token"
}

ORG_SLUG=""
ORG_ID=""

create_org() {
  # generate a unique slug
  ORG_SLUG="acme-$(date +%s)"
  say "🏢 Create org: $ORG_SLUG"
  resp=$(curl -fsS -X POST "$API_URL/orgs" \
    -H "$(auth_hdr)" \
    -H 'Content-Type: application/json' \
    -d "{\"slug\":\"$ORG_SLUG\",\"name\":\"$ORG_SLUG\"}")
  ORG_ID=$(echo "$resp" | jq -r '.id // .organization?.id // empty')
  if [[ -z "$ORG_ID" || "$ORG_ID" == "null" ]]; then
    fail "Org create failed: $(echo "$resp" | jq -c '.')"
  fi
  ok "Org created"
}

CATEGORY_ID=""
create_category() {
  say "🏷️  Create category"
  resp=$(curl -fsS -X POST "$API_URL/categories" \
    -H "$(auth_hdr)" \
    -H "X-Org: $ORG_SLUG" \
    -H 'Content-Type: application/json' \
    -d '{"name":"Hats"}')
  CATEGORY_ID=$(echo "$resp" | jq -r '.id // empty')
  if [[ -z "$CATEGORY_ID" || "$CATEGORY_ID" == "null" ]]; then
    echo "$resp" | jq . || true
    fail "Category creation failed"
  fi
  ok "Category: $CATEGORY_ID"
}

PRODUCT_ID=""
create_product() {
  say "🧢 Create product with category"
  body=$(jq -n --arg sku "SKU-$(date +%s)" --arg cat "$CATEGORY_ID" \
    '{title:"Baseball Cap", type:"PHYSICAL", status:"ACTIVE", price:19.99, sku:$sku, description:"A nice hat", categoryId:$cat, inventoryQty:0}')
  resp=$(curl -fsS -X POST "$API_URL/products" \
    -H "$(auth_hdr)" \
    -H "X-Org: $ORG_SLUG" \
    -H 'Content-Type: application/json' \
    -d "$body") || { echo "$resp" | jq . || true; fail "Product create failed"; }
  PRODUCT_ID=$(echo "$resp" | jq -r '.id // empty')
  if [[ -z "$PRODUCT_ID" || "$PRODUCT_ID" == "null" ]]; then
    echo "$resp" | jq . || true
    fail "Product create failed"
  fi
  ok "Product: $PRODUCT_ID"
}

add_inventory() {
  say "📦 +5 inventory"
  resp=$(curl -fsS -X POST "$API_URL/products/$PRODUCT_ID/inventory" \
    -H "$(auth_hdr)" \
    -H "X-Org: $ORG_SLUG" \
    -H 'Content-Type: application/json' \
    -d '{"delta":5}')
  qty=$(echo "$resp" | jq -r '.inventoryQty // empty')
  if [[ -z "$qty" ]]; then
    echo "$resp" | jq . || true
    fail "Add inventory failed"
  fi
  ok "Inventory now: $qty"
}

clear_category() {
  say "🧹 Clear category"
  resp=$(curl -fsS -X PUT "$API_URL/products/$PRODUCT_ID" \
    -H "$(auth_hdr)" \
    -H "X-Org: $ORG_SLUG" \
    -H 'Content-Type: application/json' \
    -d '{"categoryId":null}')
  cid=$(echo "$resp" | jq -r '.categoryId')
  if [[ "$cid" != "null" ]]; then
    echo "$resp" | jq . || true
    fail "Failed to clear category"
  fi
  ok "Category cleared"
}

# Run
login
create_org
create_category
create_product
add_inventory
clear_category

say "🎉 Smoke OK"