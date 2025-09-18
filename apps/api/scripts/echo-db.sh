#!/usr/bin/env bash
# apps/api/scripts/echo-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== DATABASE_URL checks ==="
echo "from .env:    $(awk -F= '$1=="DATABASE_URL"{print $2}' .env 2>/dev/null || echo '<none>')"
if [[ -f .env.local ]]; then
  echo "from .env.local: $(awk -F= '$1=="DATABASE_URL"{print $2}' .env.local 2>/dev/null || echo '<none>')"
else
  echo "from .env.local: <none>"
fi
echo "from shell:    ${DATABASE_URL:-<unset>}"

DB_NOQS="${DATABASE_URL%%\?*}"
if [[ -z "${DB_NOQS}" ]]; then
  DB_NOQS="$(awk -F= '$1=="DATABASE_URL"{print $2}' .env 2>/dev/null | sed 's|\?.*$||')"
fi

if [[ -n "${DB_NOQS}" ]]; then
  echo "psql to:       ${DB_NOQS}"
  psql "${DB_NOQS}" -c 'select current_user, current_database();' || {
    echo "psql connection FAILED (check credentials / Postgres running)"; exit 1;
  }
else
  echo "Could not resolve a DATABASE_URL to test."; exit 1
fi