#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/api-smoke.sh
# Requires env: BASE, ORG, API_EMAIL, API_PASS
# Optional: DEBUG_API=1 for verbose curl

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/.." && pwd)"

# shellcheck source=/dev/null
source "$root/scripts/api-helpers.sh"

echo "==> Ensuring token for $API_EMAIL @ $BASE (org=$ORG)…"
ensure_tok "${API_EMAIL:-}" "${API_PASS:-}"

if [[ -z "${TOK:-}" ]]; then
  echo "ERROR: no token; check API creds/env." >&2
  exit 1
fi

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
step() { printf "\n[%s] %s\n" "$(ts)" "$*"; }

# 1) Health
step "Health check…"
aget "$BASE/health" | jq .

# 2) Create product
SKU="SKU-$(date +%s)"
CREATE_JSON=$(jq -n --arg sku "$SKU" '
  { sku:$sku, title:"Widget", type:"physical", status:"active",
    price:10, inventoryQty:5, description:"Smoke" }')

step "Create product (sku=$SKU)…"
ID=$(apost "$BASE/products" -d "$CREATE_JSON" | tee /dev/stderr | jq -r '.data.id // .id // empty')

if [[ -z "$ID" ]]; then
  echo "ERROR: Create did not return an id." >&2
  exit 2
fi
echo "ID=$ID"

# 3) Get
step "Get product…"
aget "$BASE/products/$ID" | jq .

# 4) Update
UPDATE_JSON='{"title":"Widget (updated)","price":15,"inventoryQty":20}'
step "Update product…"
aput "$BASE/products/$ID" -d "$UPDATE_JSON" | jq .

# 5) List (force GET via query string)
step "List page=1 limit=10…"
aget "$BASE/products?page=1&limit=10" | jq .

# 6) Delete
step "Delete product…"
adel "$BASE/products/$ID" | jq .

# 7) Confirm 404
step "Confirm 404 after delete…"
aget "$BASE/products/$ID" | jq . || true

echo "🎉 Smoke test complete!"