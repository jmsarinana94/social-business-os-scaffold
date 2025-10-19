#!/usr/bin/env bash
set -Eeuo pipefail

# Usage (envs may come from direnv or inline):
# API=http://localhost:4001/v1 ORG=org_demo API_EMAIL=you@example.com API_PASS=test1234 ./scripts/demo_seed_idempotent.sh

: "${API:?need API like http://localhost:4001/v1}"
: "${ORG:?need ORG like org_demo}"
: "${API_EMAIL:?need API_EMAIL}"
: "${API_PASS:?need API_PASS}"

JQ=${JQ:-jq}

echo "API=$API"
echo "ORG=$ORG"
echo "EMAIL=$API_EMAIL"

# -------- Helpers --------
curl_api() {
  # curl_api METHOD PATH [JSON_BODY]
  local method="$1"; shift
  local path="$1"; shift
  local body="${1:-}"

  if [[ -n "$body" ]]; then
    curl -fsS -X "$method" "$API$path" \
      -H 'content-type: application/json' \
      -H "x-org-id: $ORG" \
      -H "authorization: Bearer $TOKEN" \
      -d "$body"
  else
    curl -fsS -X "$method" "$API$path" \
      -H 'content-type: application/json' \
      -H "x-org-id: $ORG" \
      -H "authorization: Bearer $TOKEN"
  fi
}

ensure_product() {
  # ensure_product SKU TITLE PRICE TYPE [TARGET_INVENTORY]
  local SKU="$1"
  local TITLE="$2"
  local PRICE="$3"
  local TYPE="$4"                     # PHYSICAL | DIGITAL | SERVICE
  local TARGET_INV="${5:-0}"          # default 0 if not provided

  echo
  echo "[*] $TITLE  (SKU=$SKU, price=$PRICE, type=$TYPE, target=${TARGET_INV})"

  # 1) Upsert product (create if not exists, otherwise update metadata)
  #    We POST to /products; service can choose to upsert by (orgId, sku)
  local upsert_payload
  upsert_payload=$(cat <<JSON
{"sku":"$SKU","title":"$TITLE","price":$PRICE,"type":"$TYPE","status":"ACTIVE"}
JSON
)
  local prod_json
  prod_json="$(curl_api POST "/products" "$upsert_payload" || curl_api GET "/products")"

  # 2) Get the product id (by SKU)
  local PID
  PID="$(curl_api GET "/products" | $JQ -r --arg sku "$SKU" '.data[] | select(.sku==$sku) | .id' | head -n1)"
  if [[ -z "$PID" || "$PID" == "null" ]]; then
    echo "❌ Could not locate product id for SKU=$SKU"; return 1
  fi
  echo "   ↳ id=$PID"

  # 3) Adjust inventory for PHYSICAL only
  if [[ "$TYPE" == "PHYSICAL" ]]; then
    local cur_inv
    cur_inv="$(curl_api GET "/products/$PID/inventory" | $JQ -r '.inventoryQty')"
    cur_inv="${cur_inv:-0}"
    local delta=$(( TARGET_INV - cur_inv ))
    if (( delta != 0 )); then
      if (( delta > 0 )); then
        echo "   ↳ inventory: $cur_inv → $TARGET_INV  (delta +$delta)"
      else
        echo "   ↳ inventory: $cur_inv → $TARGET_INV  (delta $delta)"
      fi
      # API expects {"delta": number}
      curl_api POST "/products/$PID/inventory" "{\"delta\": $delta}" | $JQ .
    else
      echo "   ↳ inventory already $TARGET_INV (no change)"
    fi
  else
    echo "   ↳ no inventory change (non-PHYSICAL)"
  fi
}

# -------- Login (idempotent) --------
# signup is safe (upsert org + user); if it fails, we still proceed to login
curl -fsS -X POST "$API/auth/signup" \
  -H 'content-type: application/json' \
  -H "x-org-id: $ORG" \
  -d "{\"email\":\"$API_EMAIL\",\"password\":\"$API_PASS\"}" >/dev/null || true

TOKEN="$(
  curl -fsS -X POST "$API/auth/login" \
    -H 'content-type: application/json' \
    -H "x-org-id: $ORG" \
    -d "{\"email\":\"$API_EMAIL\",\"password\":\"$API_PASS\"}" | $JQ -r .access_token
)"
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "❌ Failed to obtain token"; exit 1
fi
echo "✅ Logged in (token acquired)"

echo "🚀 Seeding (idempotent)…"

# -------- Seed items --------
# SKU, Title, Price, Type, TargetInventory (for PHYSICAL)
ensure_product "MUG-BLUE"  "Blue Mug"     12.50 "PHYSICAL" 50
ensure_product "MUG-RED"   "Red Mug"      11.00 "PHYSICAL" 30
ensure_product "TOTE-CANV" "Canvas Tote"  18.00 "PHYSICAL" 40
ensure_product "GC-25"     "Gift Card \$25" 25.00 "DIGITAL"    # no target param needed
ensure_product "EBOOK-GUIDE" "E-Book: Guide" 9.99 "DIGITAL"   # no target param needed

echo
echo "✅ Done. Current products:"
curl_api GET "/products" | $JQ .

#!/usr/bin/env bash
set -Eeuo pipefail

# Usage (envs may come from direnv or inline):
# API=http://localhost:4001/v1 ORG=org_demo API_EMAIL=you@example.com API_PASS=test1234 ./scripts/demo_seed_idempotent.sh

: "${API:?need API like http://localhost:4001/v1}"
: "${ORG:?need ORG like org_demo}"
: "${API_EMAIL:?need API_EMAIL}"
: "${API_PASS:?need API_PASS}"

JQ=${JQ:-jq}

echo "API=$API"
echo "ORG=$ORG"
echo "EMAIL=$API_EMAIL"

# -------- Helpers --------
curl_api() {
  # curl_api METHOD PATH [JSON_BODY]
  local method="$1"; shift
  local path="$1"; shift
  local body="${1:-}"

  if [[ -n "$body" ]]; then
    curl -fsS -X "$method" "$API$path" \
      -H 'content-type: application/json' \
      -H "x-org-id: $ORG" \
      -H "authorization: Bearer $TOKEN" \
      -d "$body"
  else
    curl -fsS -X "$method" "$API$path" \
      -H 'content-type: application/json' \
      -H "x-org-id: $ORG" \
      -H "authorization: Bearer $TOKEN"
  fi
}

ensure_product() {
  # ensure_product SKU TITLE PRICE TYPE [TARGET_INVENTORY]
  local SKU="$1"
  local TITLE="$2"
  local PRICE="$3"
  local TYPE="$4"                     # PHYSICAL | DIGITAL | SERVICE
  local TARGET_INV="${5:-0}"          # default 0 if not provided

  echo
  echo "[*] $TITLE  (SKU=$SKU, price=$PRICE, type=$TYPE, target=${TARGET_INV})"

  # 1) Upsert product (create if not exists, otherwise update metadata)
  #    We POST to /products; service can choose to upsert by (orgId, sku)
  local upsert_payload
  upsert_payload=$(cat <<JSON
{"sku":"$SKU","title":"$TITLE","price":$PRICE,"type":"$TYPE","status":"ACTIVE"}
JSON
)
  local prod_json
  prod_json="$(curl_api POST "/products" "$upsert_payload" || curl_api GET "/products")"

  # 2) Get the product id (by SKU)
  local PID
  PID="$(curl_api GET "/products" | $JQ -r --arg sku "$SKU" '.data[] | select(.sku==$sku) | .id' | head -n1)"
  if [[ -z "$PID" || "$PID" == "null" ]]; then
    echo "❌ Could not locate product id for SKU=$SKU"; return 1
  fi
  echo "   ↳ id=$PID"

  # 3) Adjust inventory for PHYSICAL only
  if [[ "$TYPE" == "PHYSICAL" ]]; then
    local cur_inv
    cur_inv="$(curl_api GET "/products/$PID/inventory" | $JQ -r '.inventoryQty')"
    cur_inv="${cur_inv:-0}"
    local delta=$(( TARGET_INV - cur_inv ))
    if (( delta != 0 )); then
      if (( delta > 0 )); then
        echo "   ↳ inventory: $cur_inv → $TARGET_INV  (delta +$delta)"
      else
        echo "   ↳ inventory: $cur_inv → $TARGET_INV  (delta $delta)"
      fi
      # API expects {"delta": number}
      curl_api POST "/products/$PID/inventory" "{\"delta\": $delta}" | $JQ .
    else
      echo "   ↳ inventory already $TARGET_INV (no change)"
    fi
  else
    echo "   ↳ no inventory change (non-PHYSICAL)"
  fi
}

# -------- Login (idempotent) --------
# signup is safe (upsert org + user); if it fails, we still proceed to login
curl -fsS -X POST "$API/auth/signup" \
  -H 'content-type: application/json' \
  -H "x-org-id: $ORG" \
  -d "{\"email\":\"$API_EMAIL\",\"password\":\"$API_PASS\"}" >/dev/null || true

TOKEN="$(
  curl -fsS -X POST "$API/auth/login" \
    -H 'content-type: application/json' \
    -H "x-org-id: $ORG" \
    -d "{\"email\":\"$API_EMAIL\",\"password\":\"$API_PASS\"}" | $JQ -r .access_token
)"
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "❌ Failed to obtain token"; exit 1
fi
echo "✅ Logged in (token acquired)"

echo "🚀 Seeding (idempotent)…"

# -------- Seed items --------
# SKU, Title, Price, Type, TargetInventory (for PHYSICAL)
ensure_product "MUG-BLUE"  "Blue Mug"     12.50 "PHYSICAL" 50
ensure_product "MUG-RED"   "Red Mug"      11.00 "PHYSICAL" 30
ensure_product "TOTE-CANV" "Canvas Tote"  18.00 "PHYSICAL" 40
ensure_product "GC-25"     "Gift Card \$25" 25.00 "DIGITAL"    # no target param needed
ensure_product "EBOOK-GUIDE" "E-Book: Guide" 9.99 "DIGITAL"   # no target param needed

echo
echo "✅ Done. Current products:"
curl_api GET "/products" | $JQ .
