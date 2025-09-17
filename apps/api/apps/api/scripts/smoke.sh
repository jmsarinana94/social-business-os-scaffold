#!/usr/bin/env bash
# apps/api/scripts/smoke.sh
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Smoke test for Products API
#
# Required env:
#   BASE  - e.g. http://127.0.0.1:4000  (default if unset)
#   ORG   - e.g. demo                    (default if unset)
#
# Optional env:
#   EMAIL / PASS  - if provided, we login and send Authorization: Bearer <token>
#   DEBUG_API=1   - verbose curl
#
# Requires: curl, jq
# ──────────────────────────────────────────────────────────────────────────────

BASE="${BASE:-http://127.0.0.1:4000}"
ORG="${ORG:-demo}"

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 1
fi

# Normalize BASE (strip trailing slash)
BASE="${BASE%/}"

ts()   { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
step() { printf "\n[%s] %s\n" "$(ts)" "$*"; }

# Build common curl args
_curl_common=(-sS -H "x-org: ${ORG}")
if [[ "${DEBUG_API:-}" == "1" ]]; then
  _curl_common=(-v "${_curl_common[@]}")
fi

# Functions that add JSON header and method
get()    { curl "${_curl_common[@]}"    "$@"; }
post()   { curl "${_curl_common[@]}" -H "Content-Type: application/json" -X POST "$@"; }
put()    { curl "${_curl_common[@]}" -H "Content-Type: application/json" -X PUT  "$@"; }
delete() { curl "${_curl_common[@]}" -X DELETE "$@"; }

# If we obtain a token, we’ll extend _curl_common to include Authorization
attach_bearer() {
  local token="$1"
  _curl_common+=(-H "Authorization: Bearer ${token}")
}

# ──────────────────────────────────────────────────────────────────────────────
# 1) Health
step "Health check…"
get "$BASE/health" | jq .

# ──────────────────────────────────────────────────────────────────────────────
# 2) Optional login (if EMAIL and PASS are provided)
TOKEN=""
if [[ -n "${EMAIL:-}" && -n "${PASS:-}" ]]; then
  step "Login (EMAIL provided)…"
  LOGIN_RESP="$(post "$BASE/auth/login" -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\"}")"
  STATUS_CODE="$(echo "$LOGIN_RESP" | jq -r '.statusCode // empty')"

  if [[ -n "$STATUS_CODE" && "$STATUS_CODE" != "200" && "$STATUS_CODE" != "201" ]]; then
    echo "$LOGIN_RESP" | jq .
    echo "WARN: Login response included statusCode=$STATUS_CODE (continuing without auth)" >&2
  else
    TOKEN="$(echo "$LOGIN_RESP" | jq -r '.access_token // empty')"
    if [[ -n "$TOKEN" && "$TOKEN" != "null" ]]; then
      echo "TOKEN: ${TOKEN:0:16}…"
      attach_bearer "$TOKEN"
    else
      echo "WARN: Login did not return access_token (continuing without auth)" >&2
    fi
  fi
else
  step "Skipping login (no EMAIL/PASS provided)…"
fi

# ──────────────────────────────────────────────────────────────────────────────
# 3) Create product
RND="$(LC_ALL=C tr -dc A-Z0-9 </dev/urandom | head -c 5)"
SKU="SMOKE-${RND}"

CREATE_JSON="$(jq -n --arg sku "$SKU" '
  {
    sku: $sku,
    title: "Smoke Widget",
    description: "Created by smoke.sh",
    type: "PHYSICAL",
    status: "ACTIVE",
    price: "12.00"
  }')"

step "Create product (sku: $SKU)…"
CREATE_RESP="$(post "$BASE/products" -d "$CREATE_JSON")"
echo "$CREATE_RESP" | jq .

ID="$(echo "$CREATE_RESP" | jq -r '.id // .data.id // empty')"
if [[ -z "$ID" || "$ID" == "null" ]]; then
  echo "ERROR: Create did not return an id." >&2
  exit 2
fi
echo "ID=$ID"

# ──────────────────────────────────────────────────────────────────────────────
# 4) Get product
step "Get product…"
get "$BASE/products/$ID" | jq .

# ──────────────────────────────────────────────────────────────────────────────
# 5) Update product
UPDATE_JSON='{"title":"Smoke Widget (updated)","price":"19.00"}'
step "Update product…"
put "$BASE/products/$ID" -d "$UPDATE_JSON" | jq .

# ──────────────────────────────────────────────────────────────────────────────
# 6) List (pagination)
step "List page=1 limit=5…"
LIST_RESP="$(get "$BASE/products?page=1&limit=5")"
echo "$LIST_RESP" | jq .
COUNT="$(echo "$LIST_RESP" | jq -r '.data | length // 0')"
echo "Listed $COUNT products."

# ──────────────────────────────────────────────────────────────────────────────
# 7) Delete product
step "Delete product…"
delete "$BASE/products/$ID" | jq .

# ──────────────────────────────────────────────────────────────────────────────
# 8) Confirm 404 after delete (do not fail the whole script)
step "Confirm 404 after delete…"
set +e
AFTER_DELETE="$(get "$BASE/products/$ID")"
set -e

echo "$AFTER_DELETE" | jq .
if echo "$AFTER_DELETE" | jq -e '.statusCode == 404' >/dev/null 2>&1; then
  echo "Confirmed 404 after delete."
else
  echo "WARN: Expected 404 after delete; got a different response." >&2
fi

echo "🎉 Smoke test complete"
