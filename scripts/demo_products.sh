#!/usr/bin/env bash
set -euo pipefail

# --- Config (override via env or .envrc) ---
API="${API:-http://localhost:4001/v1}"
ORG="${ORG:-org_demo}"               # IMPORTANT: this is the ORG **id** (not the slug)
EMAIL="${EMAIL:-you@example.com}"
PASS="${PASS:-test1234}"

SKU="${SKU:-MUG-BLUE}"
TITLE="${TITLE:-Blue Mug}"
PRICE="${PRICE:-12.50}"
PTYPE="${PTYPE:-PHYSICAL}"           # PHYSICAL | DIGITAL
PSTATUS="${PSTATUS:-ACTIVE}"         # ACTIVE | INACTIVE
DELTA="${DELTA:-25}"                 # inventory change

echo "API=$API ORG=$ORG EMAIL=$EMAIL SKU=$SKU DELTA=$DELTA"

# --- 1) Health check ---
curl -fsS "$API/health" >/dev/null || {
  echo "API not healthy at $API/health" >&2; exit 1;
}

# --- 2) Login ---
TOKEN="$(
  curl -sS -X POST "$API/auth/login" \
    -H 'content-type: application/json' \
    -H "x-org-id: $ORG" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | jq -r '.access_token // .token'
)"
if [[ -z "${TOKEN}" || "${TOKEN}" == "null" ]]; then
  echo "Login failed: no access token" >&2; exit 1;
fi
echo "TOKEN=${TOKEN:0:32}..."

# --- 3) Sanity: token orgId matches the x-org-id we’ll send ---
# (nice guardrail to avoid using a slug accidentally)
jwt_org="$(python3 - <<'PY' "$TOKEN"
import os,sys,base64,json
tok=sys.argv[1]
try:
  p=tok.split('.')[1]; p+='='*(-len(p)%4)
  print(json.loads(base64.urlsafe_b64decode(p)).get('orgId',''))
except Exception as e:
  print('')
PY
)"
if [[ "$jwt_org" != "$ORG" ]]; then
  echo "WARNING: JWT orgId ($jwt_org) != ORG ($ORG). Re-run with ORG set to the org **id** (e.g., org_demo)." >&2
  exit 1
fi

# --- helper: auth headers ---
auth=(-H "authorization: Bearer $TOKEN" -H "x-org-id: $ORG")

# --- 4) Ensure product exists (idempotent by SKU) ---
# Try create; on 500/409/etc, we’ll still fetch it below.
create_resp="$(
  curl -sS -X POST "$API/products" \
    -H 'content-type: application/json' "${auth[@]}" \
    -d "$(jq -nc --arg sku "$SKU" --arg title "$TITLE" --argjson price "$PRICE" \
           --arg type "$PTYPE" --arg status "$PSTATUS" \
           '{sku:$sku,title:$title,price:$price,type:$type,status:$status}')"
  || true
)"
echo "Create product response (may be new or existing):"
echo "$create_resp" | jq .

# --- 5) Resolve PID by SKU ---
PID="$(
  curl -sS "$API/products?page=1&limit=50" "${auth[@]}" \
  | jq -r --arg sku "$SKU" '.data[] | select(.sku==$sku) | .id' | head -n1
)"
if [[ -z "${PID:-}" ]]; then
  echo "Could not find product with SKU=$SKU after create/list. Aborting." >&2
  exit 1
fi
echo "PID=$PID"

# --- 6) Adjust inventory (ONLY { delta }) ---
adj_resp="$(
  curl -sS -X POST "$API/products/$PID/inventory" \
    -H 'content-type: application/json' "${auth[@]}" \
    -d "$(jq -nc --argjson d "$DELTA" '{delta:$d}')" \
  | jq .
)"
echo "Adjusted:"
echo "$adj_resp"

# --- 7) Verify inventory ---
echo "Verify inventory:"
curl -sS "$API/products/$PID/inventory" "${auth[@]}" | jq .

echo "Done ✅"