#!/usr/bin/env bash
set -euo pipefail

# --- Env bootstrap ---
cd "$(dirname "$0")"
source ./set_env.sh >/dev/null 2>&1 || true

# Fallbacks if set_env.sh didn't define these:
: "${BASE_URL:=http://127.0.0.1:4000}"
: "${ORG:=acme}"
HDR=(-H "Content-Type: application/json" -H "x-org: ${ORG}")

# Fresh values per run
SKU="CAP-$(jot -r 1 1000 99999 2>/dev/null || echo $RANDOM)"
IK_A="$(uuidgen 2>/dev/null || echo rand-$RANDOM)"
IK_B="$(uuidgen 2>/dev/null || echo rand-$RANDOM)"

echo "== Using ORG=$ORG  BASE_URL=$BASE_URL  SKU=$SKU =="
echo "IK_A=$IK_A"
echo "IK_B=$IK_B"
echo

# 1) Create (expect 201)
echo "== 1) Create (IK_A) → expect 201 Created =="
curl -i -s -X POST "$BASE_URL/products" "${HDR[@]}" \
  -H "Idempotency-Key: $IK_A" \
  -d "{\"title\":\"Cap\",\"price\":\"14.99\",\"type\":\"physical\",\"status\":\"active\",\"sku\":\"$SKU\"}" \
| head -n 20
echo

# 2) Replay same key + same body (expect 200, same payload)
echo "== 2) Replay (same IK_A + same body) → expect 200 (replay) =="
curl -i -s -X POST "$BASE_URL/products" "${HDR[@]}" \
  -H "Idempotency-Key: $IK_A" \
  -d "{\"title\":\"Cap\",\"price\":\"14.99\",\"type\":\"physical\",\"status\":\"active\",\"sku\":\"$SKU\"}" \
| head -n 20
echo

# 3) Strictness: same key + different body (title/price changed) → expect 200 replay of original
# (If you configured strict 409, adjust expectation accordingly.)
echo "== 3) Same IK_A + DIFFERENT body → expect REPLAY of original (200) =="
curl -i -s -X POST "$BASE_URL/products" "${HDR[@]}" \
  -H "Idempotency-Key: $IK_A" \
  -d "{\"title\":\"Cap (edited)\",\"price\":\"19.99\",\"type\":\"physical\",\"status\":\"active\",\"sku\":\"$SKU\"}" \
| head -n 20
echo

# 4) Different key + SAME SKU → expect 200 with existing row (no duplicate)
echo "== 4) Different IK_B + SAME SKU → expect 200 (existing row), no duplicate =="
curl -i -s -X POST "$BASE_URL/products" "${HDR[@]}" \
  -H "Idempotency-Key: $IK_B" \
  -d "{\"title\":\"Cap dup\",\"price\":\"14.99\",\"type\":\"physical\",\"status\":\"active\",\"sku\":\"$SKU\"}" \
| head -n 20
echo

# 5) Verify only one DB row for that SKU
echo "== 5) Verify only ONE DB row for SKU=$SKU in org=$ORG =="
curl -s "$BASE_URL/products" "${HDR[@]}" \
| jq --arg SKU "$SKU" '{count: (.data | map(select(.sku==$SKU)) | length),
                         items: (.data | map(select(.sku==$SKU)) | map({id, sku, title}))}'
echo

echo "Done ✅"