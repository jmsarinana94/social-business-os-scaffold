#!/usr/bin/env bash
set -euo pipefail

# Smoke test for Products API (no auth token; uses x-org header)
# Requirements:
#   - env: BASE (e.g. http://127.0.0.1:4000), ORG (e.g. demo)
#   - tools: curl, jq
# Optional:
#   - DEBUG_API=1 to enable verbose curl output

: "${BASE:?Missing BASE (e.g. http://127.0.0.1:4000)}"
: "${ORG:?Missing ORG  (e.g. demo)}"

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 1
fi

# Normalize BASE (strip trailing slash)
BASE="${BASE%/}"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
step() { printf "\n[%s] %s\n" "$(ts)" "$*"; }

# Curl helpers
_curl_common=(-sS -H "x-org: ${ORG}")
if [[ "${DEBUG_API:-}" == "1" ]]; then
  _curl_common=(-v "${_curl_common[@]}")
fi

get()    { curl "${_curl_common[@]}"    "$@"; }
post()   { curl "${_curl_common[@]}" -H "Content-Type: application/json" -X POST "$@"; }
put()    { curl "${_curl_common[@]}" -H "Content-Type: application/json" -X PUT  "$@"; }
delete() { curl "${_curl_common[@]}" -X DELETE "$@"; }

# 1) Health
step "Health check…"
get "$BASE/health" | jq .

# 2) Create product (server will generate SKU if omitted)
CREATE_JSON='{
  "title": "Widget",
  "description": "Smoke",
  "type": "physical",
  "status": "active",
  "price": 12
}'

step "Create product…"
CREATE_RESP="$(post "$BASE/products" -d "$CREATE_JSON")"
echo "$CREATE_RESP" | jq .

ID="$(echo "$CREATE_RESP" | jq -r '.id // .data.id // empty')"
if [[ -z "$ID" || "$ID" == "null" ]]; then
  echo "ERROR: Create did not return an id." >&2
  exit 2
fi
echo "ID=$ID"

# 3) Get
step "Get product…"
get "$BASE/products/$ID" | jq .

# 4) Update
UPDATE_JSON='{"title":"Widget (updated)","price":19}'
step "Update product…"
put "$BASE/products/$ID" -d "$UPDATE_JSON" | jq .

# 5) List (pagination)
step "List page=1 limit=5…"
get "$BASE/products?page=1&limit=5" | jq .

# 6) Delete
step "Delete product…"
delete "$BASE/products/$ID" | jq .

# 7) Confirm 404 after delete (do not fail the script)
step "Confirm 404 after delete…"
set +e
GET_AFTER_DELETE="$(get "$BASE/products/$ID")"
STATUS_MSG="$(echo "$GET_AFTER_DELETE" | jq -r '.statusCode // empty')"
echo "$GET_AFTER_DELETE" | jq .
set -e

if [[ "$STATUS_MSG" != "404" && "$GET_AFTER_DELETE" != *'"statusCode": 404'* ]]; then
  echo "WARN: Expected 404 after delete; got different response." >&2
fi

echo "🎉 Smoke test complete"