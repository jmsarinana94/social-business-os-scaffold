#!/usr/bin/env bash
# apps/api/test-products.sh
# Robust create/list/delete smoke test that won't exit on non-2xx
set -uo pipefail

BASE="${BASE:-http://localhost:4010/v1}"
ORG="${ORG:-org_demo}"
EMAIL="${API_EMAIL:-you@example.com}"
PASS="${API_PASS:-test1234}"

echo "== Ping health =="
curl -sS "$BASE/health" | jq . || true
echo

echo "== Login =="
TOKEN=$(
  curl -sS "$BASE/auth/login" \
    -H "content-type: application/json" \
    -H "x-org-id: $ORG" \
    -d '{"email":"'"$EMAIL"'","password":"'"$PASS"'"}' \
  | jq -r '.access_token // .accessToken // .token // empty'
)
if [ -z "$TOKEN" ]; then
  echo "Login failed (no token)"; exit 1
fi
echo "TOKEN len=${#TOKEN}"
echo

# headers
hdr_org=(-H "x-org-id: $ORG")
hdr_auth=(-H "authorization: Bearer $TOKEN")

echo "== LIST before =="
curl -sS -w '\nHTTP:%{http_code}\n' "$BASE/products" "${hdr_org[@]}" "${hdr_auth[@]}" \
  | tee /tmp/list.before.out
echo

SKU="WIDGET-$(LC_ALL=C tr -dc A-Z0-9 </dev/urandom | head -c 6)"
CREATE_JSON='{"sku":"'"$SKU"'","title":"Demo Widget","price":"19.99","type":"PHYSICAL","status":"ACTIVE"}'
echo "== CREATE body =="
echo "$CREATE_JSON"
echo

echo "== CREATE =="
curl -sS -w '\nHTTP:%{http_code}\n' -X POST "$BASE/products" \
  -H "content-type: application/json" \
  "${hdr_org[@]}" "${hdr_auth[@]}" \
  -d "$CREATE_JSON" \
  | tee /tmp/create.out
echo

NEW_ID=$(awk 'BEGIN{b=0}/^{/{b=1}b' /tmp/create.out | jq -r '.id // empty' 2>/dev/null || true)

if [ -z "$NEW_ID" ]; then
  echo "!! CREATE did not return an id. Raw response was:"
  cat /tmp/create.out
  echo
else
  echo "NEW_ID=$NEW_ID  SKU=$SKU"
  echo

  echo "== GET just-created =="
  curl -sS -w '\nHTTP:%{http_code}\n' "$BASE/products/$NEW_ID" \
    "${hdr_org[@]}" "${hdr_auth[@]}" \
    | tee /tmp/get.out
  echo

  echo "== LIST after =="
  curl -sS -w '\nHTTP:%{http_code}\n' "$BASE/products" "${hdr_org[@]}" "${hdr_auth[@]}" \
    | tee /tmp/list.after.out
  echo

  echo "== DELETE =="
  curl -sS -w '\nHTTP:%{http_code}\n' -X DELETE "$BASE/products/$NEW_ID" \
    "${hdr_org[@]}" "${hdr_auth[@]}" \
    | tee /tmp/delete.out
  echo

  echo "== CONFIRM 404 =="
  curl -sS -w '\nHTTP:%{http_code}\n' "$BASE/products/$NEW_ID" \
    "${hdr_org[@]}" "${hdr_auth[@]}" \
    | tee /tmp/get.after.delete.out
  echo
fi

echo "== Done =="
