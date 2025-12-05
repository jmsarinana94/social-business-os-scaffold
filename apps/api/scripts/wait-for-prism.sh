#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://127.0.0.1:4010}"
PROBE_PATH="${PROBE_PATH:-/orgs}"     # must be a GET-able path
TIMEOUT_SECS="${TIMEOUT_SECS:-20}"

deadline=$(( $(date +%s) + TIMEOUT_SECS ))
echo "Waiting for Prism at ${BASE}${PROBE_PATH} (timeout: ${TIMEOUT_SECS}s)…"

# 1) Wait for the TCP port to accept connections (best-effort; nc isn't everywhere)
if command -v nc >/dev/null 2>&1; then
  host="$(printf '%s\n' "$BASE" | sed -E 's#^https?://([^:/]+).*$#\1#')"
  port="$(printf '%s\n' "$BASE" | sed -E 's#^https?://[^:/]+:?([0-9]+)?.*$#\1#')"
  port="${port:-80}"
  while ! nc -z "$host" "$port" 2>/dev/null; do
    if (( $(date +%s) >= deadline )); then
      echo "Timed out waiting for TCP ${host}:${port}"
      exit 1
    fi
    sleep 0.25
  done
fi

# 2) Wait for HTTP to return a *real* status code (not 000 from curl on connect errors)
while :; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE}${PROBE_PATH}" || echo 000)"
  # Accept anything that is not the curl error “000”
  if [[ "$code" != "000" ]]; then
    echo "Prism is up (status ${code})."
    break
  fi
  if (( $(date +%s) >= deadline )); then
    echo "Timed out waiting for Prism at ${BASE}${PROBE_PATH}"
    exit 1
  fi
  sleep 0.25
done