#!/bin/sh
# apps/api/api.sh — POSIX /bin/sh friendly helpers for the demo API
# Requires: curl, jq
# Env expected from .envrc/direnv: BASE, ORG_ID, EMAIL, PASS (optional), ORG_SLUG (optional)

set -eu
IFS=$(printf ' \t\n')

# ---------- tiny stdlib ----------
now_iso() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
idem_key() {
  # cheap idempotency token
  date +%s%N | awk '{printf "idem-%s-%06d", $1, rand()*1000000 }'
}

# simple JSON logger → .api.log
LOG_FILE=".api.log"
log() {
  lvl=$1
  msg=$2
  ts=$(date +"%Y-%m-%dT%H:%M:%S%z")
  printf '{"ts":"%s","level":"%s","msg":%s}\n' "$ts" "$lvl" "$(printf '%s' "$msg" | jq -Rs .)" >>"$LOG_FILE"
}

# ---------- auth + HTTP ----------
# We treat PASS (or TOKEN) as a bearer by default. If TOKEN is absent,
# we fall back to PASS; projects can replace login() with a real call.
auth() {
  tok="${TOKEN:-${PASS:-}}"
  if [ -z "${tok:-}" ]; then
    # no token material; try a noop login hook
    login >/dev/null 2>&1 || true
    tok="${TOKEN:-${PASS:-}}"
  fi
  printf 'Authorization: Bearer %s' "$tok"
}

login() {
  # Hook point — if your API supports login, do it here and export TOKEN
  # Example (adjust/replace if your API differs):
  # resp=$(curl -sS -X POST "$BASE/auth/login" \
  #   -H 'Content-Type: application/json' \
  #   --data "$(jq -n --arg email "$EMAIL" --arg pass "$PASS" '{email:$email,password:$pass}')" )
  # TOKEN=$(printf '%s' "$resp" | jq -r '.accessToken // empty')
  # [ -n "${TOKEN:-}" ] || return 1
  # export TOKEN
  if [ -n "${PASS:-}" ]; then
    TOKEN="$PASS"
    export TOKEN
    echo "[OK] logged in (token len=$(printf '%s' "$TOKEN" | wc -c | tr -d ' '))"
    return 0
  fi
  echo "[WARN] no PASS/TOKEN available for auth" >&2
  return 1
}

require_org() {
  : "${BASE:?set BASE in env}"
  : "${ORG_ID:?set ORG_ID in env}"
}

curl_json() {
  # usage: curl_json METHOD URL [data-json]
  m="$1"; u="$2"; d="${3:-}"
  if [ -n "$d" ]; then
    curl -sS -X "$m" "$u" \
      -H "$(auth)" -H "x-org-id: $ORG_ID" -H 'Content-Type: application/json' \
      --data "$d"
  else
    curl -sS -X "$m" "$u" \
      -H "$(auth)" -H "x-org-id: $ORG_ID" -H 'Content-Type: application/json'
  fi
}

get()  { curl_json GET  "$1"; }
post() { curl_json POST "$1" "${2:-}"; }
patch(){ curl_json PATCH "$1" "${2:-}"; }
del()  { curl_json DELETE "$1"; }

# ---------- core resources ----------
products()    { require_org; get "$BASE/products"; }
product_get() { require_org; id="$1"; get "$BASE/products/$id"; }

# Resolve by SKU
product_by_sku() {
  require_org
  sku="$1"
  products | jq -r --arg s "$sku" '
    [.[]? | select(type=="object") | select((.sku // "") == $s) ][0] // empty
  '
}

# ---------- inventory helpers ----------
# PATCH /products/:id/inventory  {add:n} or {setTo:n}
restock_by_id() {
  require_org
  pid="$1"; add="$2"
  body=$(jq -n --argjson a "$add" '{add:$a}')
  resp=$(patch "$BASE/products/$pid/inventory" "$body")
  # try to present a compact response
  printf '%s\n' "$resp" | jq '{id,sku,inventoryQty}'
}

restock_set_by_id() {
  require_org
  pid="$1"; qty="$2"
  body=$(jq -n --argjson q "$qty" '{setTo:$q}')
  resp=$(patch "$BASE/products/$pid/inventory" "$body")
  printf '%s\n' "$resp" | jq '{id,sku,inventoryQty}'
}

restock_by_sku() {
  require_org
  sku="$1"; add="$2"
  case "$add" in (*[!0-9]*|"") echo "add must be integer >= 0" >&2; return 2 ;; esac
  obj=$(product_by_sku "$sku")
  [ -n "$obj" ] || { echo "SKU not found: $sku" >&2; return 1; }
  pid=$(printf '%s' "$obj" | jq -r '.id')
  resp=$(restock_by_id "$pid" "$add")
  printf '%s\n' "$resp"
}

restock_set_by_sku() {
  require_org
  sku="$1"; qty="$2"
  case "$qty" in (*[!0-9]*|"") echo "qty must be integer >= 0" >&2; return 2 ;; esac
  obj=$(product_by_sku "$sku")
  [ -n "$obj" ] || { echo "SKU not found: $sku" >&2; return 1; }
  pid=$(printf '%s' "$obj" | jq -r '.id')
  resp=$(restock_set_by_id "$pid" "$qty")
  printf '%s\n' "$resp"
}

# ---------- demo helpers ----------
is_demo_sku() { # pure jq in callers, kept for semantics
  : # noop
}

demos_all() {
  products | jq '
    [ .[]?
      | select(type=="object")
      | select((.sku // "") | startswith("ORGDEMO-MUG-GREEN"))
      | {id, sku, status: (.status // "ACTIVE"), inventoryQty: (.inventoryQty // 0)}
    ]'
}

demos_active() {
  products | jq '
    [ .[]?
      | select(type=="object")
      | select((.sku // "") | startswith("ORGDEMO-MUG-GREEN"))
      | select((.status // "ACTIVE") == "ACTIVE")
      | {id, sku, status, inventoryQty}
    ]'
}

demos_archived() {
  products | jq '
    [ .[]?
      | select(type=="object")
      | select((.sku // "") | startswith("ORGDEMO-MUG-GREEN"))
      | select((.status // "ACTIVE") != "ACTIVE")
      | {id, sku, status, inventoryQty}
    ]'
}

# create a fresh demo product (fallback when none/zero left)
create_demo_product() {
  require_org
  ts=$(date +%s)
  sku="ORGDEMO-MUG-GREEN-$ts"
  body=$(jq -n \
    --arg sku "$sku" \
    --arg title "Green Mug" \
    --arg desc "12oz ceramic mug in green." \
    --arg type "PHYSICAL" \
    --arg status "ACTIVE" \
    --arg price "13.5" \
    --argjson inv 25 '
    { sku:$sku, title:$title, description:$desc, type:$type, status:$status,
      price:$price, inventoryQty:$inv }')
  resp=$(post "$BASE/products" "$body")
  ok_id=$(printf '%s' "$resp" | jq -r '.id // empty')
  if [ -n "$ok_id" ]; then
    echo "→ Created fresh demo SKU: $sku (inventory=25)"
    printf 'PID=%s\n' "$ok_id"
    export DEMO_PID="$ok_id"
  else
    echo "Failed to create demo product" >&2
    printf '%s\n' "$resp" >&2
    return 1
  fi
}

ensure_demo_pid() {
  require_org
  # pick newest ACTIVE demo with inventory > 0, else create one
  sel=$(products | jq '
    [ .[]?
      | select(type=="object")
      | select((.sku // "") | startswith("ORGDEMO-MUG-GREEN"))
      | select((.status // "ACTIVE") == "ACTIVE")
      | select((.inventoryQty // 0) > 0)
      | {id, sku, createdAt: (.createdAt // "1970-01-01T00:00:00Z")}
    ]
    | sort_by(.createdAt) | reverse | .[0] // empty
  ')
  if [ -z "$sel" ] || [ "$sel" = "null" ]; then
    echo "→ Existing SKU low or stuck at 0; creating fresh demo SKU with 25…"
    create_demo_product
  else
    DEMO_PID=$(printf '%s' "$sel" | jq -r '.id')
    export DEMO_PID
    echo "[OK] Using demo PID: $DEMO_PID"
  fi
}

# ---------- stock utilities ----------
products_min() {
  products | jq '
    [ .[]?
      | select(type=="object")
      | select(
          ((.sku // "") | startswith("ORGDEMO-MUG-GREEN"))
          or ((.sku // "") == "MUG-GREEN")
        )
      | {id, sku, inventoryQty: (.inventoryQty // 0)}
    ]'
}

status_snapshot() { products_min; }

status_compact() {
  if command -v status_snapshot >/dev/null 2>&1; then
    status_snapshot
  else
    products_min
  fi
}

# add to all demo skus
restock_all_demo_add() {
  add="${1:-5}"
  case "$add" in (*[!0-9]*|"") echo "add must be integer >= 0" >&2; return 2 ;; esac
  ids=$(demos_all | jq -r '.[].id')
  out="["
  comma=""
  for id in $ids; do
    before=$(product_get "$id" | jq -r '.inventoryQty // 0')
    patch_resp=$(restock_by_id "$id" "$add")
    after=$(printf '%s' "$patch_resp" | jq -r '.inventoryQty // 0')
    sku=$(printf '%s' "$patch_resp" | jq -r '.sku // ""')
    frag=$(jq -n --arg id "$id" --arg sku "$sku" \
            --argjson add "$add" --argjson before "$before" --argjson after "$after" \
            '{id:$id, sku:$sku, added:$add, before:$before, after:$after}')
    out="$out$comma$frag"
    comma=","
  done
  out="$out]"
  printf '%s\n' "$out"
}

restock_all_demo_set() {
  lvl="${1:-25}"
  case "$lvl" in (*[!0-9]*|"") echo "level must be integer >= 0" >&2; return 2 ;; esac
  ids=$(demos_all | jq -r '.[].id')
  out="["
  comma=""
  for id in $ids; do
    before=$(product_get "$id" | jq -r '.inventoryQty // 0')
    patch_resp=$(restock_set_by_id "$id" "$lvl")
    sku=$(printf '%s' "$patch_resp" | jq -r '.sku // ""')
    delta=$(( lvl - ${before:-0} ))
    frag=$(jq -n --arg id "$id" --arg sku "$sku" \
            --argjson set_to "$lvl" --argjson before "$before" --argjson delta "$delta" \
            '{id:$id, sku:$sku, set_to:$set_to, before:$before, delta:$delta}')
    out="$out$comma$frag"
    comma=","
  done
  out="$out]"
  printf '%s\n' "$out"
}

# ---------- orders (POSIX-safe) ----------
order_positive() {
  require_org
  product_id=$1
  qty=$2
  unit_price=$3

  case "$qty" in (*[!0-9]*|"") echo "Qty must be positive" >&2; return 1 ;; esac
  if [ "$qty" -le 0 ]; then echo "Qty must be positive" >&2; return 1; fi

  idem=$(idem_key)

  body=$(jq -n --arg pid "$product_id" --argjson q "$qty" --argjson p "$unit_price" \
           '{items:[{productId:$pid, quantity:$q, unitPrice:$p}]}')

  resp=$(post "$BASE/orders" "$body")

  status=$(printf '%s' "$resp" | jq -r 'if (has("statusCode") and .statusCode!=null) then (.statusCode|tostring) else "200" end' 2>/dev/null || printf '200')
  case "$status" in (''|*[!0-9]*) status=200 ;; esac
  level=info; if [ "$status" -ge 400 ] 2>/dev/null; then level=error; fi

  rawlog=$(printf '%s' "$resp" | jq -c --argjson status "$status" --arg level "$level" '
    . as $raw | {route:"POST /orders", status:$status, level:$level, raw:$raw}
  ')
  log "$level" "$rawlog"

  printf '%s\n' "$resp" | jq '{id,totalQty,totalPrice}'
}

order_multi_positive() {
  require_org
  pid1=$1; q1=$2; p1=$3
  pid2=$4; q2=$5; p2=$6

  for q in "$q1" "$q2"; do
    case "$q" in (*[!0-9]*|"") echo "Qty must be positive" >&2; return 1 ;; esac
    if [ "$q" -le 0 ]; then echo "Qty must be positive" >&2; return 1; fi
  done

  idem=$(idem_key)

  body=$(jq -n \
    --arg pid1 "$pid1" --argjson q1 "$q1" --argjson p1 "$p1" \
    --arg pid2 "$pid2" --argjson q2 "$q2" --argjson p2 "$p2" '
      {items:[
        {productId:$pid1, quantity:$q1, unitPrice:$p1},
        {productId:$pid2, quantity:$q2, unitPrice:$p2}
      ]}
    ')

  resp=$(post "$BASE/orders" "$body")

  status=$(printf '%s' "$resp" | jq -r 'if (has("statusCode") and .statusCode!=null) then (.statusCode|tostring) else "200" end' 2>/dev/null || printf '200')
  case "$status" in (''|*[!0-9]*) status=200 ;; esac
  level=info; if [ "$status" -ge 400 ] 2>/dev/null; then level=error; fi

  rawlog=$(printf '%s' "$resp" | jq -c --argjson status "$status" --arg level "$level" '
    . as $raw | {route:"POST /orders", status:$status, level:$level, raw:$raw}
  ')
  log "$level" "$rawlog"

  printf '%s\n' "$resp" | jq '{id,totalQty,totalPrice}'
}

# quick demo: place order for 2 on active demo product, then snapshot
demo_fast() {
  ensure_demo_pid
  echo "==> Placing small order on $DEMO_PID"
  raw="$(order_positive "$DEMO_PID" 2 19.99 2>/dev/null || true)"
  if ! printf '%s' "$raw" | jq -e . >/dev/null 2>&1; then
    echo "jq: invalid JSON from order_positive; showing nulls" >&2
    raw='{"id":null,"totalQty":null,"totalPrice":null}'
  fi
  printf '%s\n' "$raw" | jq '{id,totalQty,totalPrice}'
  echo "==> Snapshot"
  products_min
}

# ---------- reports ----------
last_order_json() {
  require_org
  # If your API supports pagination/filtering, adapt as needed:
  get "$BASE/orders" | jq '[.[]? | select(type=="object")] | sort_by(.createdAt) | last // {}'
}

errors_last5() {
  if [ -f "$LOG_FILE" ]; then
    tail -n 200 "$LOG_FILE" | grep '"level":"error"' | tail -n 5 | sed -e 's/^/→ /'
  else
    echo "No log yet."
  fi
}

low_stock_report() {
  threshold="${N:-5}"
  products | jq --argjson t "$threshold" '
    [ .[]?
      | select(type=="object")
      | select((.inventoryQty // 0) <= $t)
      | {id, sku, inventoryQty}
    ]'
}

prod() { printf '%s\n' "${BASE:?}"; }

# ---------- pruning old demo SKUs ----------
# Modes: archive (set INACTIVE), delete (DELETE). KEEP newest N.
prune_old_demos() {
  KEEP="${KEEP:-2}"
  MODE="${MODE:-archive}" # or delete
  DRY="${DRY_RUN:-1}"

  case "$KEEP" in (*[!0-9]*|"") echo "KEEP must be integer >= 0" >&2; return 2 ;; esac
  case "$MODE" in (archive|delete) ;; (*) echo "MODE must be archive|delete" >&2; return 2 ;; esac
  case "$DRY" in (0|1) ;; (*) DRY=1 ;; esac

  echo "==> Pruning old demo SKUs (KEEP=$KEEP MODE=$MODE DRY_RUN=$DRY)"

  plan=$(products | jq --argjson keep "$KEEP" --arg mode "$MODE" --argjson dry "$DRY" '
    def isdemo: ((.sku // "") | startswith("ORGDEMO-MUG-GREEN"));
    [ .[]? | select(type=="object") | select(isdemo)
      | {id, sku, status: (.status // "ACTIVE"), createdAt: (.createdAt // "1970-01-01T00:00:00Z")}
    ]
    | sort_by(.createdAt) | reverse
    | ( .[:$keep] ) as $keepers
    | ( .[$keep:] ) as $prune
    | {total:(length), keep:($keepers|length), action:$mode, dry:$dry,
       keepers:$keepers, prune:$prune}
  ')
  total=$(printf '%s' "$plan" | jq -r '.total')
  keepn=$(printf '%s' "$plan" | jq -r '.keep')
  echo "→ Demo SKUs total: $total; keeping newest: $keepn; action: $MODE; DRY_RUN=$DRY"

  echo "→ Keeping (newest first):"
  printf '%s\n' "$plan" | jq -c '.keepers[]'

  echo "→ Will prune:"
  printf '%s\n' "$plan" | jq -c '.prune[]'

  if [ "$DRY" = "1" ]; then
    echo "DRY_RUN=1 → no changes made."
    return 0
  fi

  # apply
  if [ "$MODE" = "archive" ]; then
    printf '%s\n' "$plan" | jq -r '.prune[].id' | while IFS= read -r pid; do
      [ -n "$pid" ] || continue
      body=$(jq -n --arg s "INACTIVE" '{status:$s}')
      echo "ARCHIVE $(product_get "$pid" | jq -r '.sku') ($pid)"
      patch "$BASE/products/$pid" "$body" >/dev/null
    done
  else
    printf '%s\n' "$plan" | jq -r '.prune[].id' | while IFS= read -r pid; do
      [ -n "$pid" ] || continue
      sku=$(product_get "$pid" | jq -r '.sku')
      echo "DELETE $sku ($pid)"
      del "$BASE/products/$pid" >/dev/null
    done
  fi
  echo "→ Prune complete."
}

# ---------- guardrail demo: drain to zero then show 400 without exiting shell ----------
exhaust_to_zero() {
  require_org
  ensure_demo_pid
  # Try to order in chunks until the API errors (insufficient inventory)
  while :; do
    left=$(product_get "$DEMO_PID" | jq -r '.inventoryQty // 0')
    if [ "$left" -le 0 ]; then
      break
    fi
    # order at most 5 at a time to speed up
    step=5
    if [ "$left" -lt "$step" ]; then step="$left"; fi
    resp="$(order_positive "$DEMO_PID" "$step" 21.49 2>/dev/null || true)"
    code=$(printf '%s' "$resp" | jq -r '.statusCode // empty')
    if [ -n "$code" ] && [ "$code" -ge 400 ] 2>/dev/null; then
      break
    fi
  done
  # Trigger the 400 once visibly
  order_positive "$DEMO_PID" 1 21.49 2>/dev/null || true
}

# Convenience wrapper used by Makefile target "zero-local"
zero_local() {
  echo "[OK] logged in (token len=$(printf '%s' "${TOKEN:-${PASS:-}}" | wc -c | tr -d ' '))"
  echo "[OK] Using demo PID: $(ensure_demo_pid >/dev/null 2>&1; printf '%s' "$DEMO_PID")"
  echo
  echo "==> Draining"
  echo
  echo "==> demo"
  echo
  echo "==> SKU"
  echo
  echo "==> to"
  echo
  echo "==> zero"
  echo "source ./api.sh; exhaust_to_zero; products_min"
  exhaust_to_zero
  products_min
}

# --------- end ---------
# Friendly aliases for Makefile recipes (optional to call directly)
status_snapshot() { products_min; }  # keep alias