#!/usr/bin/env bash
set -euo pipefail

QTY="${1:-2}"
PRICE="${2:-19.99}"
RESET_ONLY="${3:-}"

BASE="${BASE:?BASE env required}"
ORG_ID="${ORG_ID:?ORG_ID env required}"
PASS="${PASS:?PASS env required}"

curl_json() {
  local method="$1"; shift
  local url="$1"; shift
  local data="${1:-}"
  if [[ -n "$data" ]]; then
    curl -sS -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -H "x-org-id: ${ORG_ID}" \
      -H "Authorization: Bearer ${PASS}" \
      --data "$data"
  else
    curl -sS -X "$method" "$url" \
      -H "x-org-id: ${ORG_ID}" \
      -H "Authorization: Bearer ${PASS}"
  fi
}

echo "[probe] GET /products ..."
PRODUCTS_JSON="$(curl_json GET "${BASE}/products")"

# Choose a demo product (prefer ORGDEMO-MUG-GREEN*, else fallback to first)
SELECTED_JSON="$(jq -c '
  if type=="array" then
    ( [ .[] | select(.sku|tostring|startswith("ORGDEMO-MUG-GREEN")) ] | (if length>0 then . else input end) ) as $c
    | ($c | if type=="array" and length>0 then .[0] else .[0] end)
  else
    .
  end
' <<<"$PRODUCTS_JSON" <<<"$PRODUCTS_JSON")"

PID="$(jq -r '.id // empty' <<<"$SELECTED_JSON")"
SKU="$(jq -r '.sku // empty' <<<"$SELECTED_JSON")"

if [[ -z "$PID" ]] || [[ -z "$SKU" ]]; then
  echo "[error] Could not locate a demo product (got: $(jq -r 'type' <<<"$PRODUCTS_JSON"))"
  exit 1
fi

echo "[probe] selected PID=${PID} (SKU: ${SKU})"

# If we were only asked to reset inventories, do that and exit.
if [[ "${RESET_ONLY}" == "--reset-only" ]]; then
  echo "Resetting inventory to 25 for DEMO_PREFIX=ORGDEMO-MUG-GREEN"
  # Reset every demo product that startswith ORGDEMO-MUG-GREEN (and the root SKU too)
  if jq -e 'type=="array"' >/dev/null 2>&1 <<<"$PRODUCTS_JSON"; then
    # Put each matching product to 25
    jq -r '.[] | select(.sku|tostring|startswith("ORGDEMO-MUG-GREEN")) | .id, .sku' <<<"$PRODUCTS_JSON" | \
    while read -r id; do
      read -r maybeSku || true
      if [[ "$id" == cmg* || "$id" == *-* ]]; then
        echo "PUT /products/${id} -> " \
        && curl_json PUT "${BASE}/products/${id}" "{\"id\":\"${id}\",\"inventoryQty\":25}" >/dev/null \
        && echo "200"
      fi
      # Also PUT by SKU for convenience when id isn't a canonical id
      if [[ -n "${maybeSku:-}" && "${maybeSku}" != "null" ]]; then
        echo "PUT /products/${maybeSku} -> " \
        && curl_json PUT "${BASE}/products/${maybeSku}" "{\"sku\":\"${maybeSku}\",\"inventoryQty\":25}" >/dev/null \
        && echo "200"
      fi
    done
    echo "Done."
  fi
  exit 0
fi

# Always ensure inventoryQty=25 on the chosen product before adding to cart
echo "[update] PUT /products/${PID} (inventoryQty=25)"
curl_json PUT "${BASE}/products/${PID}" "$(jq -nc --arg id "$PID" --arg sku "$SKU" --argjson qty 25 '{id:$id, sku:$sku, inventoryQty:$qty}')" >/dev/null

echo "[cart] POST /cart (qty=${QTY}, price=${PRICE})"
CART_JSON="$(curl_json POST "${BASE}/cart" "$(jq -nc --argjson qty "${QTY}" --arg price "${PRICE}" '{lines:[{sku:"ORGDEMO-MUG-GREEN", qty:$qty, price:$price}] }')")"

# Some API versions don’t return totals; avoid hard-fail on asserts.
if jq -e 'has("totalQty")' >/dev/null 2>&1 <<<"$CART_JSON"; then
  ACT_QTY="$(jq -r '.totalQty' <<<"$CART_JSON")"
  echo "[assert] totalQty=${ACT_QTY}"
fi
if jq -e 'has("totalPrice")' >/dev/null 2>&1 <<<"$CART_JSON"; then
  ACT_TOTAL="$(jq -r '.totalPrice' <<<"$CART_JSON")"
  echo "[assert] totalPrice=${ACT_TOTAL}"
fi

echo "[list] demo products (sku & qty)"
LIST_JSON="$(curl_json GET "${BASE}/products")"
jq -r '
  if type=="array" then . else [.] end
  | [ .[] | select(.sku|tostring|startswith("ORGDEMO-MUG-GREEN") or .=="MUG-GREEN") ]
  | sort_by(.sku)
  | .[]
  | "\(.sku)\tqty=\(.inventoryQty)"
' <<<"$LIST_JSON"

echo "----------------------------------------------------------------------"
echo "[done] demo complete (PID=${PID}, SKU=${SKU})"