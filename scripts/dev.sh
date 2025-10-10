#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"

export PORT="${PORT:-3000}"
export ORG="${ORG:-acme}"
EMAIL="${EMAIL:-a@b.com}"
PASS="${PASS:-pw}"
SKU="${SKU:-W-1}"

pushd "$API_DIR" >/dev/null

echo "== Build API =="
pnpm build >/dev/null

echo "== Start API (background) =="
# Kill previous on same port if any
lsof -ti tcp:$PORT | xargs -r kill -9 || true
(node dist/main.js &) >/dev/null 2>&1
sleep 1

echo "== Create org =="
curl -sS -X POST "http://localhost:$PORT/orgs" \
  -H 'Content-Type: application/json' \
  --data-raw "{\"slug\":\"$ORG\",\"name\":\"Acme Inc\"}" | jq .

echo "== Signup/Login =="
curl -sS -X POST "http://localhost:$PORT/auth/signup" \
  -H "X-Org: $ORG" -H 'Content-Type: application/json' \
  --data-raw "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | jq .

TOKEN=$(curl -sS -X POST "http://localhost:$PORT/auth/login" \
  -H "X-Org: $ORG" -H 'Content-Type: application/json' \
  --data-raw "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | jq -r '.access_token // .token')
echo "TOKEN: ${TOKEN:0:16}..."

echo "== Create product =="
curl -sS -X POST "http://localhost:$PORT/products" \
  -H "X-Org: $ORG" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  --data-raw "{\"title\":\"Widget\",\"type\":\"PHYSICAL\",\"status\":\"ACTIVE\",\"price\":12.5,\"sku\":\"$SKU\"}" | jq .

echo "== List products =="
curl -sS "http://localhost:$PORT/products" \
  -H "X-Org: $ORG" -H "Authorization: Bearer $TOKEN" | jq .

popd >/dev/null