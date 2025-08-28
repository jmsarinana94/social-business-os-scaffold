#!/usr/bin/env bash
#
# apps/api/scripts/api-helpers.sh
# Helper functions to interact with the API
# Usage:
#   source scripts/api-helpers.sh
#   api_login "$API_EMAIL" "$API_PASS"
#   aget "$BASE/products"
#   apost "$BASE/products" -d '{"title":"New"}'

# --- Environment defaults ---
TOK="${TOK-}"
BASE="${BASE:-http://localhost:4000}"
ORG="${ORG:-demo}"
API_EMAIL="${API_EMAIL:-}"
API_PASS="${API_PASS:-}"

# --- Required binaries ---
_require() {
  for bin in "$@"; do
    command -v "$bin" >/dev/null 2>&1 || {
      echo "Missing required binary: $bin" >&2
      exit 1
    }
  done
}
_require curl jq

# --- API login ---
api_login() {
  if [[ -z "${1:-}" || -z "${2:-}" ]]; then
    echo "Usage: api_login <email> <password>" >&2
    return 2
  fi
  local email="$1" pass="$2" resp tok
  resp="$(curl -sS -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${pass}\"}")" || {
    echo "Login failed: request error" >&2
    return 3
  }
  tok="$(jq -r '.access_token // .token // .data.access_token // .data.token // empty' <<<"$resp")"
  if [[ -z "$tok" ]]; then
    echo "Login failed: no token in response" >&2
    echo "$resp" >&2
    return 4
  fi
  TOK="$tok"
  export TOK
  [[ -n "${DEBUG_API:-}" ]] && echo "Token: ${TOK:0:20}…" >&2
}

# --- Ensure token is fresh (optional) ---
# Requires `jwt` CLI for exp check. If missing, it just logs in.
ensure_tok() {
  local now exp
  if [[ -n "${TOK:-}" ]]; then
    if command -v jwt >/dev/null 2>&1; then
      exp="$(jwt "$TOK" | jq -r '.exp // 0')" || exp=0
      now="$(date +%s)"
      if [[ "$exp" -gt $((now + 30)) ]]; then
        return 0
      fi
    else
      # If jwt not installed, assume token may be stale and re-login
      :
    fi
  fi
  if [[ -n "$API_EMAIL" && -n "$API_PASS" ]]; then
    api_login "$API_EMAIL" "$API_PASS"
  else
    echo "Usage: api_login <email> <password>" >&2
    return 2
  fi
}

# --- Authenticated curl wrappers ---
aget() {
  ensure_tok "$API_EMAIL" "$API_PASS" || return 1
  curl -sS -H "Authorization: Bearer $TOK" "$@"
}

apost() {
  ensure_tok "$API_EMAIL" "$API_PASS" || return 1
  curl -sS -X POST -H "Authorization: Bearer $TOK" \
    -H "Content-Type: application/json" "$@"
}

aput() {
  ensure_tok "$API_EMAIL" "$API_PASS" || return 1
  curl -sS -X PUT -H "Authorization: Bearer $TOK" \
    -H "Content-Type: application/json" "$@"
}

adel() {
  ensure_tok "$API_EMAIL" "$API_PASS" || return 1
  curl -sS -X DELETE -H "Authorization: Bearer $TOK" "$@"
}