#!/usr/bin/env bash
set -euo pipefail

# ============================
# Config (override by exporting before running, if you want)
# ============================
BASE_URL="${BASE_URL:-http://127.0.0.1:4000}"
ORG="${ORG:-acme}"
REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
SKU="${SKU:-CAP-200}"

# Generate stable keys for this run if not provided
KEY_A="${KEY_A:-$(uuidgen 2>/dev/null || echo A-$(date +%s))}"
KEY_B="${KEY_B:-$(uuidgen 2>/dev/null || echo B-$(date +%s))}"

# Payloads
PAYLOAD_ORIG=$(jq -c -n --arg sku "$SKU" '{title:"Cap", price:"14.99", type:"physical", status:"active", sku:$sku}')
PAYLOAD_DIFF=$(jq -c -n --arg sku "$SKU" '{title:"Cap v2", price:"19.99", type:"physical", status:"active", sku:$sku}')

# ============================
# Tooling checks
# ============================
need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing $1. Please install it."; exit 1; }; }
need curl
need jq
need redis-cli

say() { echo; echo "== $* =="; }

purge_idemp_key() {
  local key="$1"
  local pattern="idem:v1:${ORG}:POST:/products:${key}:*"
  say "Purging Redis keys for key=${key}"
  local keys
  keys=$(redis-cli -u "$REDIS_URL" KEYS "$pattern" | tr -d '\r' || true)
  if [[ -n "${keys}" ]]; then
    while IFS= read -r k; do
      [[ -z "$k" ]] && continue
      redis-cli -u "$REDIS_URL" DEL "$k" >/dev/null || true
    done <<< "$keys"
  fi
}

count_and_list_sku() {
  curl -s "${BASE_URL}/products" -H "Content-Type: application/json" -H "x-org: ${ORG}" \
  | jq --arg SKU "$SKU" '{count: (.data | map(select(.sku==$SKU)) | length), items: (.data | map(select(.sku==$SKU)) | map({id, sku, title, price, status}))}'
}

post_with_key() {
  local key="$1"
  local body="$2"
  curl -i -s -X POST "${BASE_URL}/products" \
    -H "Content-Type: application/json" \
    -H "x-org: ${ORG}" \
    -H "Idempotency-Key: ${key}" \
    -d "${body}"
}

# ============================
# Banner
# ============================
say "Testing against ${BASE_URL} org=${ORG} sku=${SKU}"
say "Keys: KEY_A=${KEY_A} KEY_B=${KEY_B}"

# Clean slate for these keys
purge_idemp_key "$KEY_A"
purge_idemp_key "$KEY_B"

# ============================
# 1) Create product (new SKU, Key A) -> expect 201
# ============================
say "Step 1: POST create (new SKU) with KEY_A (expect 201 Created)"
post_with_key "$KEY_A" "$PAYLOAD_ORIG" | sed -n '1,20p'
post_with_key "$KEY_A" "$PAYLOAD_ORIG" | tail -n +21 | jq . || true

# ============================
# 2) Replay same key + same body -> expect replay (200/201 + Idempotency-Replayed)
# ============================
say "Step 2: POST replay same KEY_A + SAME body (expect replay; no new row)"
post_with_key "$KEY_A" "$PAYLOAD_ORIG" | sed -n '1,20p'
post_with_key "$KEY_A" "$PAYLOAD_ORIG" | tail -n +21 | jq . || true

# ============================
# 3) Same key + different body -> expect 409 (strict idempotency)
# ============================
say "Step 3: POST same KEY_A + DIFFERENT body (expect 409)"
post_with_key "$KEY_A" "$PAYLOAD_DIFF" | sed -n '1,20p'
post_with_key "$KEY_A" "$PAYLOAD_DIFF" | tail -n +21 | jq . || true

# ============================
# 4) Different key + same SKU -> expect 409 (unique org+sku)
# ============================
say "Step 4: POST different KEY_B + SAME SKU (expect 409)"
post_with_key "$KEY_B" "$PAYLOAD_ORIG" | sed -n '1,20p'
post_with_key "$KEY_B" "$PAYLOAD_ORIG" | tail -n +21 | jq . || true

# ============================
# 5) Verify only one row in DB for this SKU
# ============================
say "Step 5: Verify only one row exists for SKU=${SKU}"
count_and_list_sku

say "Done."
