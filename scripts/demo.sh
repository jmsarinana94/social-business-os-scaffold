#!/usr/bin/env bash
# scripts/demo.sh
set -euo pipefail

# ---------- Config (env overridable) ----------
API="${API:-http://localhost:4001/v1}"
# IMPORTANT: ORG must be an Organization *id* (e.g., org_demo), not the slug.
ORG="${ORG:-org_demo}"
EMAIL="${EMAIL:-you@example.com}"
PASS="${PASS:-test1234}"

JQ="${JQ:-jq}"

# ---------- Helpers ----------
bold() { printf "\033[1m%s\033[0m\n" "$*"; }
die()  { echo "❌ $*" >&2; exit 1; }

require() {
  command -v "$1" >/dev/null 2>&1 || die "Missing dependency: $1"
}

login() {
  require curl
  require jq

  bold "Logging in…"
  local resp tok
  resp=$(curl -sS -w "\n%{http_code}" -X POST "$API/auth/login" \
    -H 'content-type: application/json' \
    -H "x-org-id: $ORG" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
  # Split body and status code (last line)
  tok=$(printf "%s" "$resp" | sed '$d' | jq -r '.access_token // .token // empty')
  code=$(printf "%s" "$resp" | tail -n1)

  if [[ -z "${tok:-}" ]]; then
    echo "❌ Failed to obtain token (HTTP $code). Full body below:" >&2
    printf "%s\n" "$(printf "%s" "$resp" | sed '$d')" >&2
    exit 1
  fi

  export TOKEN="$tok"
  echo "✅ Logged in. TOKEN=${TOKEN:0:32}…"
}

need_token() {
  [[ -n "${TOKEN:-}" ]] || login
}

health() {
  require curl
  curl -sS "$API/health" | $JQ .
}

list() {
  need_token
  curl -sS "$API/products" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" | $JQ .
}

get_by_id() {
  need_token
  local id="$1"
  curl -sS "$API/products/$id" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" | $JQ .
}

# Resolve a product id by SKU (first exact match)
pid_by_sku() {
  need_token
  local sku="$1"
  curl -sS "$API/products" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" \
  | $JQ -r --arg SKU "$sku" '.data[] | select(.sku==$SKU) | .id' | head -n1
}

get_by_sku() {
  local sku="$1"
  local pid
  pid=$(pid_by_sku "$sku")
  [[ -n "$pid" ]] || die "No product found with SKU=$sku"
  get_by_id "$pid"
}

create() {
  # Usage:
  #   create '{"title":"Blue Mug","sku":"MUG-BLUE","price":12.5,"type":"PHYSICAL","status":"ACTIVE"}'
  # or:
  #   create "Blue Mug" "MUG-BLUE" 12.5 PHYSICAL ACTIVE
  need_token

  local body
  if [[ $# -eq 1 && "$1" == \{* ]]; then
    body="$1"
  elif [[ $# -eq 5 ]]; then
    local title="$1" sku="$2" price="$3" type="$4" status="$5"
    body=$(jq -n --arg t "$title" --arg s "$sku" --argjson p "$price" --arg ty "$type" --arg st "$status" \
      '{title:$t, sku:$s, price:$p, type:$ty, status:$st}')
  else
    cat >&2 <<EOF
Usage:
  $0 create '{"title":"Blue Mug","sku":"MUG-BLUE","price":12.5,"type":"PHYSICAL","status":"ACTIVE"}'
  $0 create "Blue Mug" "MUG-BLUE" 12.5 PHYSICAL ACTIVE
EOF
    exit 2
  fi

  curl -sS -X POST "$API/products" \
    -H 'content-type: application/json' \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" \
    -d "$body" | $JQ .
}

update() {
  # Usage: update <SKU> '{"title":"…","price":…}'
  need_token
  local sku="$1"; shift || true
  local body="${1:-}"
  [[ -n "$body" ]] || die "Provide a JSON body."

  local pid
  pid=$(pid_by_sku "$sku")
  [[ -n "$pid" ]] || die "No product found with SKU=$sku"

  curl -sS -X PUT "$API/products/$pid" \
    -H 'content-type: application/json' \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" \
    -d "$body" | $JQ .
}

delete_sku() {
  need_token
  local sku="$1"
  local pid
  pid=$(pid_by_sku "$sku")
  [[ -n "$pid" ]] || die "No product found with SKU=$sku"

  curl -sS -X DELETE "$API/products/$pid" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" | $JQ .
}

inventory() {
  # Usage: inventory <SKU>
  need_token
  local sku="$1"
  local pid
  pid=$(pid_by_sku "$sku")
  [[ -n "$pid" ]] || die "No product found with SKU=$sku"

  curl -sS "$API/products/$pid/inventory" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" | $JQ .
}

bump() {
  # Usage: bump <SKU> <DELTA>
  need_token
  local sku="$1" delta="$2"
  [[ "$delta" =~ ^-?[0-9]+$ ]] || die "delta must be integer"

  local pid
  pid=$(pid_by_sku "$sku")
  [[ -n "$pid" ]] || die "No product found with SKU=$sku"

  curl -sS -X POST "$API/products/$pid/inventory" \
    -H 'content-type: application/json' \
    -H "authorization: Bearer $TOKEN" \
    -H "x-org-id: $ORG" \
    -d "{\"delta\": $delta}" | $JQ .
}

seed() {
  # Runs your existing seeder if present
  if [[ -x "scripts/demo_seed.sh" ]]; then
    ./scripts/demo_seed.sh
  else
    die "scripts/demo_seed.sh not found or not executable."
  fi
}

help() {
  cat <<EOF
Usage: $0 <command> [args]

Env (override as needed):
  API=$API
  ORG=$ORG     (Organization *id*, e.g. org_demo)
  EMAIL=$EMAIL
  PASS=$PASS

Commands:
  login                       Obtain and export TOKEN
  health                      GET /health
  list                        List products
  get-id <ID>                 Get a product by id
  get <SKU>                   Get a product by SKU
  create <JSON|args...>       Create product (see examples)
  update <SKU> <JSON>         Update product by SKU
  delete <SKU>                Delete product by SKU
  inventory <SKU>             Show inventory for SKU
  bump <SKU> <DELTA>          Adjust inventory (integer delta)
  seed                        Run scripts/demo_seed.sh if present

Examples:
  $0 login
  $0 list
  $0 get MUG-BLUE
  $0 create "Blue Mug" "MUG-BLUE" 12.5 PHYSICAL ACTIVE
  $0 update MUG-BLUE '{"price":13.0}'
  $0 bump MUG-BLUE -2
  $0 delete MUG-BLUE
  $0 seed
EOF
}

cmd="${1:-help}"; shift || true
case "$cmd" in
  login)      login ;;
  health)     health ;;
  list)       list ;;
  get-id)     get_by_id "${1:?id required}" ;;
  get)        get_by_sku "${1:?SKU required}" ;;
  create)     create "$@" ;;
  update)     update "${1:?SKU required}" "${2:?JSON body required}" ;;
  delete)     delete_sku "${1:?SKU required}" ;;
  inventory)  inventory "${1:?SKU required}" ;;
  bump)       bump "${1:?SKU required}" "${2:?DELTA required}" ;;
  seed)       seed ;;
  *)          help ;;
esac