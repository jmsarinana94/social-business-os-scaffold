#!/usr/bin/env bash
set -euo pipefail
# Protect against zsh history expansion if someone runs this interactively:
set +H || true

# ---- Config (env overrideable) ----
BASE="${BASE:-http://localhost:4010/v1}"
EMAIL="${EMAIL:-tester@example.com}"
PASS="${PASS:-Passw0rd!demo}"
SKU="${SKU:-MUG-GREEN}"          # pick an existing seeded SKU or override
QTY="${QTY:-1}"
PRICE="${PRICE:-19.99}"          # unit price (decimal dollars)

echo "== Config =="
echo "BASE=$BASE"
echo "EMAIL=$EMAIL  (password is set: $([ -n "$PASS" ] && echo yes || echo no))"
echo

# ---- Helpers ----
fail(){ echo "❌ $*" >&2; exit 1; }

json(){ jq -C . || cat; }  # pretty-print if jq exists

auth_header(){ echo "Authorization: Bearer $TOKEN"; }

# ---- 0) Health ----
echo "== Health =="
curl -sS "$BASE/health" | json
echo

# ---- 1) Login (or sign up if your user isn't there) ----
echo "== Login =="
LOGIN_RES="$(curl -sS -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")" || true
TOKEN="$(printf '%s' "$LOGIN_RES" | jq -r '.access_token // empty' 2>/dev/null || true)"

if [[ -z "${TOKEN:-}" ]]; then
  echo "Login failed, trying signup once..."
  SIGNUP_RES="$(curl -sS -X POST "$BASE/auth/signup" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"orgSlug\":\"org_demo\",\"orgName\":\"Demo Org\"}")" || true
  echo "$SIGNUP_RES" | json
  echo "Retrying login..."
  LOGIN_RES="$(curl -sS -X POST "$BASE/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")" || true
  TOKEN="$(printf '%s' "$LOGIN_RES" | jq -r '.access_token // empty' 2>/dev/null || true)"
fi

[[ -n "${TOKEN:-}" ]] || { echo "$LOGIN_RES" | json; fail "Could not obtain access_token"; }
echo "TOKEN len: ${#TOKEN}"
echo

# ---- 2) Pick a product (by SKU) ----
echo "== Products =="
PRODS_JSON="$(curl -sS "$BASE/products")" || fail "GET /products failed"
echo "$PRODS_JSON" | json | sed -n '1,200p' >/dev/null # print nicely
PID="$(echo "$PRODS_JSON" | jq -r ".[] | select(.sku==\"$SKU\") | .id" | head -n1 || true)"
[[ -n "${PID:-}" && "$PID" != "null" ]] || fail "Could not find product with SKU=$SKU"
echo "Using PID=$PID (SKU=$SKU)"
echo

# ---- 3) Adjust inventory (+10) ----
echo "== Adjust inventory (+10) =="
curl -sS -X POST "$BASE/products/$PID/inventory" \
  -H "$(auth_header)" -H 'Content-Type: application/json' \
  -d '{"delta":10,"reason":"initial stock"}' | json
echo

# ---- 4) Create order ----
echo "== Create order =="
ORDER_BODY="$(jq -cn \
  --arg pid "$PID" \
  --arg email "customer@example.com" \
  --arg currency "USD" \
  --argjson qty "$QTY" \
  --argjson unitPrice "$PRICE" \
  '{items:[{productId:$pid, quantity:$qty, unitPrice:$unitPrice}], currency:$currency, customerEmail:$email}')" || fail "jq build failed"

ORDER_JSON="$(curl -sS -X POST "$BASE/orders" \
  -H "$(auth_header)" -H 'Content-Type: application/json' \
  -d "$ORDER_BODY")" || fail "POST /orders failed"
echo "$ORDER_JSON" | json
echo

# ---- 5) Sanity: product + orders ----
echo "== Product (after) =="
curl -sS "$BASE/products/$PID" -H "$(auth_header)" | json
echo
echo "== Orders (auth) =="
curl -sS "$BASE/orders" -H "$(auth_header)" | json
echo
echo "✅ Done."
