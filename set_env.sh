#!/usr/bin/env bash
# set_env.sh
export BASE_URL="${BASE_URL:-http://127.0.0.1:4000}"
export ORG="${ORG:-acme}"
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"

echo "== Environment =="
echo "BASE_URL=${BASE_URL}"
echo "ORG=${ORG}"
echo "REDIS_URL=${REDIS_URL}"
echo

echo "Health check:"
if command -v curl >/dev/null 2>&1; then
  if command -v jq >/dev/null 2>&1; then
    # -S show errors, -f fail on HTTP errors; don’t exit shell on failure
    if ! curl -sSf "${BASE_URL}/health" 2>/tmp/health.err | jq .; then
      echo "(health request failed)"
      echo "--- curl error ---"
      cat /tmp/health.err
      echo "------------------"
    fi
  else
    if ! curl -sSf "${BASE_URL}/health" 2>/tmp/health.err; then
      echo "(health request failed)"
      cat /tmp/health.err
    fi
    echo
  fi
else
  echo "(curl not found; skip health)"
fi