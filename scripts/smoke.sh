#!/usr/bin/env bash
set -euo pipefail

# ----------------------------
# Config (overridable via env)
# ----------------------------
PORT="${PORT:-3000}"
ORG="${ORG:-acme}"
BASE="${BASE:-http://localhost:${PORT}}"
EMAIL="${EMAIL:-demo+${RANDOM}@test.com}"
PASS="${PASS:-password123}"

# ----------------------------
# Helpers
# ----------------------------
need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ Missing dependency: $1"; exit 1; }; }
need curl
need jq

header() { echo -e "\n→ $*"; }
ok() { echo "   $*"; }

CURL_JSON=(curl -sS --fail-with-body -H "X-Org: ${ORG}" -H "Content-Type: application/json")

# ----------------------------
# Run
# ----------------------------
echo "# ---- config"
echo "PORT=${PORT}"
echo "ORG=${ORG}"
echo "BASE=${BASE}"
echo "EMAIL=${EMAIL}"

header "signup (${EMAIL} @ ${ORG})"
signup_status="$(
  "${CURL_JSON[@]}" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\",\"org\":\"${ORG}\"}" \
    -o /dev/null -w "%{http_code}" \
    "${BASE}/auth/signup" || true
)"
if [[ "$signup_status" != "200" && "$signup_status" != "201" ]]; then
  echo "❌ Unexpected signup status: ${signup_status}"
  exit 1
fi
ok "status: ${signup_status} (201 created is normal; 200 also ok)"

header "login"
TOKEN="$(
  "${CURL_JSON[@]}" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\"}" \
    "${BASE}/auth/login" \
  | jq -r '.access_token // .token'
)"
if [[ -z "${TOKEN}" || "${TOKEN}" == "null" ]]; then
  echo "❌ No JWT returned from /auth/login"
  exit 1
fi
ok "got JWT"

AUTH_HEADER=("Authorization: Bearer ${TOKEN}")

header "/auth/me"
curl -sS --fail-with-body "${BASE}/auth/me" \
  -H "X-Org: ${ORG}" -H "${AUTH_HEADER[@]}" | jq .

header "/orgs/me"
curl -sS --fail-with-body "${BASE}/orgs/me" \
  -H "X-Org: ${ORG}" | jq .

SKU="SKU-${RANDOM}"
header "create product ${SKU}"
curl -sS --fail-with-body "${BASE}/products" \
  -H "X-Org: ${ORG}" -H "${AUTH_HEADER[@]}" -H "Content-Type: application/json" \
  -d "{\"title\":\"Widget\",\"type\":\"PHYSICAL\",\"status\":\"ACTIVE\",\"price\":12.34,\"sku\":\"${SKU}\",\"description\":\"Smoke\"}" \
  | jq .

header "list products (first 3)"
curl -sS --fail-with-body "${BASE}/products" \
  -H "X-Org: ${ORG}" -H "${AUTH_HEADER[@]}" \
  | jq '.[0:3]'

echo -e "\n✅ Smoke test passed for org: ${ORG} on ${BASE}"