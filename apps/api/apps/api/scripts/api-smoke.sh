#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:4000}"
ORG="${ORG:-demo}"
API_EMAIL="${API_EMAIL:-tester+$(date +%s)@example.com}"
API_PASS="${API_PASS:-password}"

# Load helpers if present
if [ -f "$(dirname "$0")/api-helpers.sh" ]; then
  # shellcheck disable=SC1091
  source "$(dirname "$0")/api-helpers.sh"
fi

# One-time registration (idempotent)
curl -sS -X POST "$BASE/auth/register" -H "Content-Type: application/json" -H "x-org: $ORG" \
  -d "{\"email\":\"$API_EMAIL\",\"password\":\"$API_PASS\",\"name\":\"Seed\"}" >/dev/null || true

# Create
ID=$(apost "$BASE/products" -H "Content-Type: application/json" \
  -d "{\"title\":\"Widget\",\"sku\":\"SKU-$(date +%s)\",\"type\":\"physical\",\"status\":\"active\",\"price\":10,\"inventoryQty\":5}" \
  | jq -r '.data.id // .id')
echo "Created: $ID"

# Read
aget "$BASE/products/$ID" | jq .

# Update
aput "$BASE/products/$ID" -H "Content-Type: application/json" -d '{"price":17,"inventoryQty":7}' | jq .

# Delete
adel "$BASE/products/$ID" | jq .

# Confirm 404
aget "$BASE/products/$ID" | jq .
