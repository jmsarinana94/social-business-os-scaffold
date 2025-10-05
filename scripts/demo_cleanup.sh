#!/usr/bin/env bash
set -euo pipefail

# --- Config (can be overridden via env) ---
API="${API:-http://localhost:4001/v1}"
ORG="${ORG:-org_demo}"             # must be the Organization **id**
EMAIL="${EMAIL:-you@example.com}"
PASS="${PASS:-test1234}"

# Demo SKUs we seed
DEMO_SKUS=("MUG-BLUE" "MUG-RED" "TOTE-CANV" "GC-25" "EBOOK-GUIDE")

echo "API=$API"
echo "ORG=$ORG  (must be an Organization *id*, e.g. org_demo)"
echo "EMAIL=$EMAIL"

# --- Ensure TOKEN ---
if [[ -z "${TOKEN:-}" ]]; then
  echo "Logging in to acquire TOKEN…"
  TOKEN="$(curl -sS -X POST "$API/auth/login" \
    -H 'content-type: application/json' \
    -H "x-org-id: $ORG" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
    | jq -r '.access_token // .token')"
  if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
    echo "❌ Failed to login and get token."
    exit 1
  fi
  echo "✅ Logged in (token acquired)"
else
  echo "Using existing TOKEN from env."
fi

# --- Optional confirmation (skip with CLEAN_DEMO_FORCE=1) ---
if [[ "${CLEAN_DEMO_FORCE:-0}" != "1" ]]; then
  read -r -p "This will delete demo products ${DEMO_SKUS[*]} from org '$ORG'. Continue? [y/N] " ans
  [[ "$ans" == "y" || "$ans" == "Y" ]] || { echo "Aborted."; exit 0; }
fi

# --- Delete loop ---
deleted_any=0
for sku in "${DEMO_SKUS[@]}"; do
  echo
  echo "[*] Deleting SKU=$sku …"
  # Find product id by SKU
  PID="$(curl -sS "$API/products" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" \
    | jq -r --arg SKU "$sku" '.data[] | select(.sku==$SKU) | .id' \
    | head -n 1 || true)"

  if [[ -z "$PID" ]]; then
    echo "   ↳ not found (skipping)"
    continue
  fi

  # Delete
  del_out="$(curl -sS -X DELETE "$API/products/$PID" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" || true)"
  echo "   ↳ delete response: $del_out"
  deleted_any=1
done

echo
echo "✅ Cleanup complete."
echo "📋 Current products:"
curl -sS "$API/products" \
  -H "authorization: Bearer $TOKEN" \
  -H "x-org-id: $ORG" | jq .