#!/usr/bin/env bash
# scripts/dev-postgres-reset.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Safety prompt
read -p "This will DROP and recreate schema via prisma db push. Continue? [y/N] " yn
case "$yn" in
  [Yy]* ) ;;
  * ) echo "Aborted."; exit 1;;
esac

pushd "${ROOT_DIR}/apps/api" >/dev/null
echo "==> prisma db push (force reset)"
pnpm dlx prisma db push --force-reset --accept-data-loss --schema prisma/schema.postgres.prisma
echo "==> prisma generate"
pnpm dlx prisma generate --schema prisma/schema.postgres.prisma
popd >/dev/null

echo "✅ Postgres database reset & schema reapplied."