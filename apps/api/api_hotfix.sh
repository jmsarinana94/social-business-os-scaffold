#!/usr/bin/env sh
# POSIX/zsh-friendly helpers for the local demo API.
# Works when sourced from zsh or bash.
# Usage (from apps/api):
#   source ./api_hotfix.sh
#   ensure_demo_pid && echo "PID=$PID  SKU=$PID_SKU"
#   restock_set_by_sku_norm "$PID_SKU" 25
#   order_positive "$PID" 2 19.99
#   status_snapshot

# ---- Strict-ish mode (POSIX) ----
# (No 'set -o pipefail' in POSIX sh; keep it simple/portable.)
set -u

# ---- Env (defaults) ----
: "${BASE:=}"
: "${ORG_ID:=}"
: "${ORG_SLUG:=}"
: "${PASS:=}"
: "${DEMO_PREFIX:=ORGDEMO-MUG-GREEN}"
: "${PRINT_ENV:=0}"
: "${DEBUG_NET:=0}"

# ---- Binaries ----
CURL_BIN="${CURL_BIN:-$(command -v curl 2>/dev/null || true)}"
JQ_BIN="${JQ_BIN:-$(command -v jq   2>/dev/null || true)}"
SED_BIN="${SED_BIN:-$(command -v sed  2>/dev/null || true)}"
AWK_BIN="${AWK_BIN:-$(command -v awk  2>/dev/null || true)}"
HEAD_BIN="${HEAD_BIN:-$(command -v head 2>/dev/null || true)}"

log()  { printf '%s %s\n' "$1" "$2"; }
ok()   { log ok   "$*"; }
warn() { log warn "$*"; }
err()  { log err  "$*"; }

require_env() {
  if [ -z "${CURL_BIN}" ] || [ ! -x "${CURL_BIN}" ]; then err "curl not found"; return 1; fi
  if [ -z "${JQ_BIN}"   ] || [ ! -x "${JQ_BIN}"   ]; then err "jq not found";   return 1; fi
  if [ -z "${SED_BIN}"  ] || [ ! -x "${SED_BIN}"  ]; then err "sed not found";  return 1; fi
  if [ -z "${AWK_BIN}"  ] || [ ! -x "${AWK_BIN}"  ]; then err "awk not found";  return 1; fi
  if [ -z "${BASE}" ]; then err "BASE required"; return 1; fi
  if [ -z "${ORG_ID:-}" ] && [ -z "${ORG_SLUG:-}" ]; then
    err "ORG_ID or ORG_SLUG required"; return 1
  fi
}

maybe_print_env() {
  [ "${PRINT_ENV:-0}" = "1" ] || return 0
  printf 'BASE=%s\n' "${BASE}"
  printf 'ORG_ID=%s\n' "${ORG_ID:-<unset>}"
  printf 'ORG_SLUG=%s\n' "${ORG_SLUG:-<unset>}"
  if [ -n "${PASS:-}" ]; then printf 'PASS=<set>\n'; else printf 'PASS=<unset>\n'; fi
}

# ---- Curl invokers (no arrays; build argv with set --) ----

# _curl_common builds common args into $@ and executes curl.
# Usage: _curl_common <extra curl args...>
_curl_common() {
  require_env || return 1
  maybe_print_env

  # Build argv
  set -- --http1.1 -sS --connect-timeout 5 --max-time 20 \
         -H "Accept: application/json" \
         -H "Content-Type: application/json"
  [ "${DEBUG_NET:-0}" = "1" ] && set -- -v "$@"
  [ -n "${ORG_ID:-}"   ] && set -- "$@" -H "x-org-id: ${ORG_ID}"
  [ -n "${ORG_SLUG:-}" ] && set -- "$@" -H "x-org-slug: ${ORG_SLUG}"
  [ -n "${PASS:-}"     ] && set -- "$@" -H "Authorization: Bearer ${PASS}"

  # Append any extra arguments from caller and run
  "${CURL_BIN}" "$@"
}

# GET, echo body; sets CURL_CODE
http_get_body() {
  # $1 = path (e.g., /products)
  require_env || return 1
  path="$1"
  out="$(_curl_common -w '\n%{http_code}\n' "${BASE}${path}" 2>/dev/null || true)"
  code="$(printf '%s\n' "$out" | "${AWK_BIN}" 'END{print}')"
  CURL_CODE="$code"; export CURL_CODE
  # print all but last line (the code)
  printf '%s\n' "$out" | "${SED_BIN}" '$d'
  case "$code" in
    2*) return 0 ;;
    *)  return 1 ;;
  esac
}

# Send JSON; returns only status code
http_send_code() {
  # $1 method, $2 path, $3 json (optional)
  require_env || { printf '0'; return 1; }
  method="$1"; path="$2"; json="${3:-}"
  if [ -n "$json" ]; then
    _curl_common -o /dev/null -w '%{http_code}' -X "$method" "${BASE}${path}" --data "$json" 2>/dev/null || printf '0'
  else
    _curl_common -o /dev/null -w '%{http_code}' -X "$method" "${BASE}${path}" 2>/dev/null || printf '0'
  fi
}

# Send JSON; echo response body
http_send_json() {
  # $1 method, $2 path, $3 json (optional)
  require_env || return 1
  method="$1"; path="$2"; json="${3:-}"
  if [ -n "$json" ]; then
    _curl_common -X "$method" "${BASE}${path}" --data "$json"
  else
    _curl_common -X "$method" "${BASE}${path}"
  fi
}

# ---- Products ----

get_products() {
  http_get_body "/products"
}

products_min() {
  body="$(get_products)" || {
    warn "products_min: GET /products failed (HTTP ${CURL_CODE:-0})"
    printf '%s' "${body:-}" | "${HEAD_BIN}" -c 400 1>&2; echo 1>&2
    return 1
  }
  if ! printf '%s' "$body" | "${JQ_BIN}" -e 'type=="array"' >/dev/null 2>&1; then
    warn "products_min: response not an array (HTTP ${CURL_CODE:-0})"
    printf '%s' "$body" | "${HEAD_BIN}" -c 400 1>&2; echo 1>&2
    return 1
  fi
  printf '%s' "$body" | "${JQ_BIN}" -c \
    '[ .[]? | select(type=="object") | {id, sku, status:(.status//"UNKNOWN"), inventoryQty:(.inventoryQty//0)} ]'
}

# ---- Demo selection ----

ensure_demo_pid() {
  body="$(get_products)"
  if [ $? -ne 0 ] || [ -z "${body:-}" ]; then
    warn "ensure_demo_pid: /products HTTP ${CURL_CODE:-0}; body may be empty"
    probe="$(http_send_code GET "/products")"
    echo "--- probe /products code ---" 1>&2
    echo "${probe:-0}" 1>&2
    return 1
  fi

  sel="$(
    printf '%s' "$body" | "${JQ_BIN}" -r --arg p "$DEMO_PREFIX" '
      def pick(x): (x // [] | first // null);
      . as $all
      | pick([ .[] | select(.status=="ACTIVE") | select((.sku // "") | startswith($p)) ])
        // pick([ .[] | select((.sku // "") | startswith($p)) ])
        // pick([ .[] | select(.status=="ACTIVE") ])
        // pick([ .[] ])
    '
  )"

  if [ -z "${sel:-}" ] || [ "$sel" = "null" ]; then
    err "No demo item found"; return 1
  fi

  PID="$(printf '%s' "$sel" | "${JQ_BIN}" -r '.id // ""')"
  PID_SKU="$(printf '%s' "$sel" | "${JQ_BIN}" -r '.sku // ""')"
  status="$(printf '%s' "$sel" | "${JQ_BIN}" -r '.status // "UNKNOWN"')"

  if [ -z "$PID" ] || [ -z "$PID_SKU" ]; then
    err "Missing id/sku in selected product"; return 1
  fi

  if [ "$status" = "ACTIVE" ]; then
    ok "[OK] Using demo PID: $PID (SKU: $PID_SKU)"
  else
    warn "No explicit ACTIVE item; selected $PID (SKU: $PID_SKU, status=$status)"
  fi
  export PID PID_SKU
}

# ---- Inventory ----

restock_set_by_sku_norm() {
  # $1 sku, $2 level
  sku="${1:-}"; level="${2:-}"
  [ -n "$sku"   ] || { err "restock_set_by_sku_norm: sku required"; return 1; }
  [ -n "$level" ] || { err "restock_set_by_sku_norm: level required"; return 1; }

  body="$(get_products)" || { err "restock_set_by_sku_norm: /products failed (HTTP ${CURL_CODE:-0})"; return 1; }

  prod="$(
    printf '%s' "$body" | "${JQ_BIN}" -r --arg s "$sku" \
      '[ .[]? | select(type=="object") | select((.sku // "") == $s) ] | first // null'
  )"
  [ -n "$prod" ] && [ "$prod" != "null" ] || { err "SKU not found: $sku"; return 1; }

  pid="$(printf '%s' "$prod" | "${JQ_BIN}" -r '.id // ""')"
  [ -n "$pid" ] || { err "No id for sku=$sku"; return 1; }

  payload="$("${JQ_BIN}" -cn --argjson q "$level" '{inventoryQty:$q}')" || {
    err "level must be numeric"; return 1; }

  code="$(http_send_code PATCH "/products/$pid" "$payload")"
  if ! printf '%s' "$code" | "${AWK_BIN}" 'BEGIN{ok=0} {if ($0 ~ /^2/) ok=1} END{exit (ok?0:1)}'; then
    warn "PATCH /products/$pid -> $code; trying PUT"
    code="$(http_send_code PUT "/products/$pid" "$payload")"
  fi
  if ! printf '%s' "$code" | "${AWK_BIN}" 'BEGIN{ok=0} {if ($0 ~ /^2/) ok=1} END{exit (ok?0:1)}'; then
    warn "PUT /products/$pid -> $code; trying POST inventory"
    code="$(http_send_code POST "/products/$pid/inventory" "$payload")"
  fi
  if ! printf '%s' "$code" | "${AWK_BIN}" 'BEGIN{ok=0} {if ($0 ~ /^2/) ok=1} END{exit (ok?0:1)}'; then
    err "All inventory routes failed for id=$pid sku=$sku (last=$code)"; return 1
  fi

  body2="$(get_products)" || { err "post-restock /products failed"; return 1; }
  printf '%s' "$body2" | "${JQ_BIN}" -c --arg id "$pid" \
    '[ .[]? | select(type=="object") | select(.id==$id) ] | first | {id, sku, inventoryQty}'
}

# ---- Orders ----

order_positive() {
  # $1 productId, $2 qty (number), $3 unitPrice (number)
  product_id="${1:-}"; qty="${2:-}"; unit_price="${3:-}"
  [ -n "$product_id" ] || { err "order_positive: product_id required"; return 1; }
  [ -n "$qty"        ] || { err "order_positive: qty required"; return 1; }
  [ -n "$unit_price" ] || { err "order_positive: unitPrice required"; return 1; }

  payload="$("${JQ_BIN}" -cn --arg pid "$product_id" --argjson q "$qty" --argjson p "$unit_price" \
    '{items:[{productId:$pid, quantity:$q, unitPrice:$p}]}')" || {
      err "order_positive: qty/unitPrice must be numeric"; return 1; }

  resp="$(http_send_json POST "/orders" "$payload")" || { err "POST /orders failed"; return 1; }

  printf '%s' "$resp" | "${JQ_BIN}" -c '
    {
      id: (.id // null),
      totalQty: (.totalQty // (try (.items|map(.quantity)|add) catch null)),
      totalPrice: (.totalPrice // null)
    }
  '
}

# ---- Snapshot ----

status_snapshot() {
  products_min | "${JQ_BIN}" -c '[ .[] | {id, sku, inventoryQty} ]'
}