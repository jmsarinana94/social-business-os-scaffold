#!/usr/bin/env sh
# Convenience layer that sources the hotfix and exposes friendly names.

# Ensure we are in apps/api or provide relative path as needed.
if [ -f "./api_hotfix.sh" ]; then
  # shellcheck disable=SC1091
  . "./api_hotfix.sh"
else
  echo "err Could not find ./api_hotfix.sh — place it in apps/api" >&2
  return 1 2>/dev/null || exit 1
fi

# Aliases kept for compatibility with earlier Makefile targets:
restock_set_by_sku()      { restock_set_by_sku_norm "$@"; }
demos_active()            { products_min | jq -c '[ .[] | select(.status=="ACTIVE") ]'; }
demos_archived()          { products_min | jq -c '[ .[] | select(.status!="ACTIVE") ]'; }
demos_all()               { products_min; }

# Tiny demo: pick, restock to 25, order 2 @ 19.99, snapshot
demo_place_small_order() {
  ensure_demo_pid || return 1
  restock_set_by_sku_norm "$PID_SKU" 25 || true
  order_positive "$PID" 2 19.99
  status_snapshot
}

# Drain-to-zero sample (guardrail style): repeatedly orders until 400
exhaust_to_zero() {
  ensure_demo_pid || return 1
  while :; do
    r="$(order_positive "$PID" 1 19.99)"
    code="$?"
    echo "$r" | jq '.' >/dev/null 2>&1 || break
    inv="$(products_min | jq -r --arg id "$PID" '[.[]|select(.id==$id)]|first.inventoryQty')"
    [ "$inv" = "0" ] && break
  done
  status_snapshot
}