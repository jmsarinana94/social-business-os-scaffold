#!/usr/bin/env bash
set -euo pipefail

# ------------ Config (override via env if you like) ------------
BASE_URL="${BASE_URL:-http://127.0.0.1:4000}"
ORG="${ORG:-acme}"

HDR_CT="Content-Type: application/json"
HDR_ORG="x-org: ${ORG}"

HEALTH_URL="${BASE_URL%/}/health"

# TTL for waiting the API to come up (seconds)
WAIT_MAX=20

# ------------ Helpers ------------
red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    red "Missing required command: $1"; exit 1;
  }
}
need_cmd curl
# jq is optional; script will still run without pretty output
if ! command -v jq >/dev/null 2>&1; then
  yellow "jq not found — output will be less pretty (but tests still run)"
fi

rand_uuid() {
  if command -v uuidgen >/dev/null 2>&1; then uuidgen; else echo "rand-$RANDOM-$RANDOM"; fi
}

# Return only HTTP status code
http_status() {
  local method="$1"; shift
  curl -sS -o /dev/null -w "%{http_code}" "$@" -X "$method"
}

# Perform JSON POST and capture: status, headers, body
# Usage: post_json <idempotency-key> <json-body>
post_json() {
  local ik="$1"; shift
  local body="$1"; shift
  curl -sS -D /tmp/headers.$$ -o /tmp/body.$$ \
    -H "$HDR_CT" -H "$HDR_ORG" -H "Idempotency-Key: $ik" \
    -X POST "${BASE_URL%/}/products" \
    -d "$body" >/dev/null || true
  STATUS=$(awk 'NR==1{print $2}' /tmp/headers.$$)
  cat /tmp/headers.$$ >/dev/null # keep for inspection
}

header_grep() {
  local name="$1"
  awk -v IGNORECASE=1 -v n="$name:" '
    tolower($0) ~ "^" tolower(n) {
      sub(/^[^:]*:[[:space:]]*/,""); print; exit
    }' /tmp/headers.$$ | tr -d '\r'
}

# ------------ Wait for API ------------
printf "Checking API health at %s ... " "$HEALTH_URL"
ok=false
for i in $(seq 1 "$WAIT_MAX"); do
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then ok=true; break; fi
  sleep 1
done
$ok && green "OK" || { red "FAILED (server not responding)"; exit 1; }

# ------------ Test data ------------
SKU="CAP-$(jot -r 1 10000 99999 2>/dev/null || echo $RANDOM)"
IK_A="$(rand_uuid)"
IK_B="$(rand_uuid)"

echo
yellow "== Using BASE_URL=$BASE_URL ORG=$ORG =="
yellow "== SKU=$SKU IK_A=$IK_A IK_B=$IK_B =="

# ------------ 1) Create (expect 201) ------------
BODY_CREATE="{\"title\":\"Cap\",\"price\":\"14.99\",\"type\":\"physical\",\"status\":\"active\",\"sku\":\"$SKU\"}"
post_json "$IK_A" "$BODY_CREATE"
CREATE_STATUS="$STATUS"
CREATE_ID="$(jq -r '.id' /tmp/body.$$ 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' /tmp/body.$$)"
echo "create: HTTP $CREATE_STATUS  id=$CREATE_ID"
if [ "$CREATE_STATUS" != "201" ] || [ -z "$CREATE_ID" ]; then
  red "FAIL: create should be 201 and return an id"
  exit 1
fi

# ------------ 2) Replay same key+body (expect 201 + Idempotency-Replayed:true) ------------
post_json "$IK_A" "$BODY_CREATE"
REPLAY_STATUS="$STATUS"
REPLAY_FLAG="$(header_grep 'Idempotency-Replayed')"
echo "replay_same_body: HTTP $REPLAY_STATUS  Idempotency-Replayed: ${REPLAY_FLAG:-<none>}"
if [ "$REPLAY_STATUS" != "201" ]; then
  red "FAIL: replay should be 201"
  exit 1
fi

# ------------ 3) Same key + different body (expect 409) ------------
BODY_EDIT="{\"title\":\"Cap (edited)\",\"price\":\"19.99\",\"type\":\"physical\",\"status\":\"active\",\"sku\":\"$SKU\"}"
post_json "$IK_A" "$BODY_EDIT"
DIFF_BODY_STATUS="$STATUS"
echo "same_key_diff_body: HTTP $DIFF_BODY_STATUS"
if [ "$DIFF_BODY_STATUS" != "409" ]; then
  red "FAIL: same idempotency key with different body should be 409"
  exit 1
fi

# ------------ 4) Different key + same SKU (expect 200 + Upsert-Existing:true) ------------
post_json "$IK_B" "$BODY_CREATE"
DIFF_KEY_STATUS="$STATUS"
UPSERT_FLAG="$(header_grep 'Upsert-Existing')"
echo "diff_key_same_sku: HTTP $DIFF_KEY_STATUS  Upsert-Existing: ${UPSERT_FLAG:-<none>}"
if [ "$DIFF_KEY_STATUS" != "200" ]; then
  red "FAIL: different key with same SKU should be 200 (existing row)"
  exit 1
fi

# ------------ 5) Confirm only one row for that SKU ------------
if command -v jq >/dev/null 2>&1; then
  COUNT_JSON="$(curl -sS "${BASE_URL%/}/products" -H "$HDR_CT" -H "$HDR_ORG" \
    | jq --arg SKU "$SKU" '{count: (.data | map(select(.sku==$SKU)) | length),
                            items: (.data | map(select(.sku==$SKU)) | map({id, sku, title}))}')"
  echo "$COUNT_JSON"
  CNT="$(echo "$COUNT_JSON" | jq -r '.count')"
else
  RESP="$(curl -sS "${BASE_URL%/}/products" -H "$HDR_CT" -H "$HDR_ORG")"
  CNT="$(echo "$RESP" | sed -n 's/.*"sku":"'"$SKU"'".*/X/p' | wc -l | tr -d ' ')"
  echo "(jq not installed) count=$CNT"
fi

if [ "${CNT:-0}" != "1" ]; then
  red "FAIL: expected exactly 1 row with SKU=$SKU, got $CNT"
  exit 1
fi

green "✅ All idempotency checks passed."