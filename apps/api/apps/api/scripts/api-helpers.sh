# Helper functions for API calls (zsh/bash friendly)

# Required tools check (quiet if present)
command -v jq >/dev/null || { echo "jq is required"; return 1 2>/dev/null || exit 1; }
command -v curl >/dev/null || { echo "curl is required"; return 1 2>/dev/null || exit 1; }

# Defaults (can be overridden in env)
: "${BASE:=http://localhost:4000}"
: "${ORG:=demo}"

# Login and token management
api_login() {
  local email="${1:?email required}" pass="${2:?password required}"
  TOK=$(curl -sS -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" -H "x-org: $ORG" \
    -d "{\"email\":\"$email\",\"password\":\"$pass\"}" | jq -r '.access_token')
  [ -n "$TOK" ] || { echo "Login failed"; return 1; }
  echo "Token: ${TOK:0:20}…"
}

jwt() {
  echo "$1" | awk -F. '{print $2}' \
  | sed 's/-/+/g;s/_/\//g' \
  | awk '{l=length($0)%4; if(l==2){print $0"=="} else if(l==3){print $0"="} else {print $0}}' \
  | base64 -D 2>/dev/null | jq .
}

exp_left() {
  local exp now
  exp=$(jwt "$1" 2>/dev/null | jq -r '.exp')
  now=$(date +%s)
  echo $((exp - now))
}

ensure_tok() {
  local left=$(exp_left "${TOK:-}" 2>/dev/null || echo 0)
  if [ -z "${TOK:-}" ] || [ "$left" -lt 60 ]; then
    : "${API_EMAIL:?Set API_EMAIL}"
    : "${API_PASS:?Set API_PASS}"
    api_login "$API_EMAIL" "$API_PASS" >/dev/null
  fi
}

# Core curl wrappers (always send token + org)
acurl() { ensure_tok; curl -sS "$@" -H "Authorization: Bearer $TOK" -H "x-org: ${ORG}"; }
aget()  { local url="$1"; shift; acurl -G "$url" "$@"; }
apost() { local url="$1"; shift; acurl -X POST "$url" "$@"; }
aput()  { local url="$1"; shift; acurl -X PUT "$url" "$@"; }
adel()  { local url="$1"; shift; acurl -X DELETE "$url" "$@"; }
