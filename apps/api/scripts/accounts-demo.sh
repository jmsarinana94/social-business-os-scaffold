#!/usr/bin/env bash
set -euo pipefail

# ----- Defaults (override via env or flags) -----
BASE="${BASE:-http://127.0.0.1:4010}"
ORG="${E2E_ORG_SLUG:-test-org}"
EMAIL="${EMAIL:-tester@example.com}"
PASS="${PASS:-secret123}"             # ≥ 6 chars
ACC_NAME="${ACC_NAME:-TestCo}"
ACC_WEBSITE="${ACC_WEBSITE:-https://example.com}"

usage() {
  cat <<'EOF'
Usage:
  scripts/accounts-demo.sh [--base URL] [--org ORG] [--email EMAIL] [--pass PASS]
                           [--name NAME] [--website URL] [-h|--help]

Environment overrides:
  BASE, E2E_ORG_SLUG, EMAIL, PASS, ACC_NAME, ACC_WEBSITE

Examples:
  pnpm -F @repo/api demo:accounts
  pnpm -F @repo/api demo:accounts --org my-org --name "Acme Inc" --website https://acme.test
EOF
}

# ----- Flags -----
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)     BASE="$2"; shift 2 ;;
    --org)      ORG="$2"; shift 2 ;;
    --email)    EMAIL="$2"; shift 2 ;;
    --pass)     PASS="$2"; shift 2 ;;
    --name)     ACC_NAME="$2"; shift 2 ;;
    --website)  ACC_WEBSITE="$2"; shift 2 ;;
    -h|--help)  usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

command -v jq >/dev/null || { echo "This script requires 'jq' on PATH"; exit 1; }

echo "1) signup -> 201"
curl -sS -X POST "${BASE}/auth/signup" \
  -H 'Content-Type: application/json' \
  -d '{"email":"'"${EMAIL}"'","password":"'"${PASS}"'"}' | jq .

echo "2) login -> 200 (capture TOKEN)"
TOKEN="$(curl -sS -X POST "${BASE}/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"'"${EMAIL}"'","password":"'"${PASS}"'"}' | jq -r '.token')"
echo "TOKEN=${TOKEN:0:10}…"

# Build headers as a proper Bash array
AUTH=( -H "Authorization: Bearer ${TOKEN}" -H "X-Org: ${ORG}" )

echo "3) create account -> 201 (capture ACC_ID)"
ACC_ID="$(curl -sS -X POST "${BASE}/accounts" \
  "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"name":"'"${ACC_NAME}"'","website":"'"${ACC_WEBSITE}"'"}' \
  | tee /dev/stderr | jq -r '.id')"
echo "ACC_ID=${ACC_ID}"

echo "4) get by id -> 200"
curl -sS "${BASE}/accounts/${ACC_ID}" "${AUTH[@]}" | jq .

echo "5) list -> 200 (array)"
curl -sS "${BASE}/accounts" "${AUTH[@]}" | jq .

echo "6) delete -> 204"
curl -sS -X DELETE "${BASE}/accounts/${ACC_ID}" "${AUTH[@]}" \
  -o /dev/null -w "DELETE -> %{http_code}\n"

echo "7) confirm 404 after delete"
curl -sS "${BASE}/accounts/${ACC_ID}" "${AUTH[@]}" -H 'Prefer: code=404' | jq .