#!/usr/bin/env bash
set -euo pipefail

ORG=${ORG:-demo}
BASE=${BASE:-http://localhost:4000}

echo "Login…"
TOK=$(curl -sS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" -H "x-org: $ORG" \
  -d '{"email":"tester@example.com","password":"password"}' | jq -r .access_token)
echo "Token: ${TOK:0:20}…"

echo "Create…"
NEW=$(curl -sS -X POST "$BASE/products" \
  -H "Authorization: Bearer $TOK" -H "x-org: $ORG" -H "Content-Type: application/json" \
  -d '{"title":"Widget","sku":"SKU-SMOKE","type":"physical","status":"active","price":15,"inventoryQty":3,"description":"smoke"}')
ID=$(echo "$NEW" | jq -r .data.id)
echo "ID=$ID"

echo "Get…"
curl -sS "$BASE/products/$ID" -H "Authorization: Bearer $TOK" -H "x-org: $ORG" | jq .

echo "Update…"
curl -sS -X PUT "$BASE/products/$ID" \
  -H "Authorization: Bearer $TOK" -H "x-org: $ORG" -H "Content-Type: application/json" \
  -d '{"price":17,"inventoryQty":7}' | jq .

echo "List…"
curl -sS "$BASE/products?page=1&limit=5" \
  -H "Authorization: Bearer $TOK" -H "x-org: $ORG" | jq .

echo "Delete…"
curl -sS -X DELETE "$BASE/products/$ID" \
  -H "Authorization: Bearer $TOK" -H "x-org: $ORG" | jq .