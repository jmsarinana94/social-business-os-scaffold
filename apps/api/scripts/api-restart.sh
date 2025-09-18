#!/usr/bin/env bash
# apps/api/scripts/api-restart.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API_DIR="$ROOT/apps/api"

cd "$API_DIR"

echo "==> killing anything on :4000"
PID="$(lsof -ti :4000 || true)"
if [[ -n "${PID}" ]]; then
  kill -9 "$PID"
  echo "killed $PID"
else
  echo "nothing listening on 4000"
fi

echo "==> prisma generate"
pnpm prisma generate --schema=prisma/schema.prisma

echo "==> prisma db push"
pnpm prisma db push

echo "==> prisma seed (demo tester@example.com)"
ORG=demo API_EMAIL="tester@example.com" API_PASS="password123" pnpm prisma db seed

echo "==> starting API…"
pnpm start