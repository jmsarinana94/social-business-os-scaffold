#!/usr/bin/env bash
set -euo pipefail

echo "==> Restoring baseline (Prisma + build + e2e)"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# 0) make sure we have pnpm and node
command -v pnpm >/dev/null 2>&1 || { echo "pnpm not found. Install pnpm first."; exit 1; }

# 1) ensure prisma env exists for local runs
if [ ! -f "$ROOT_DIR/apps/api/prisma/.env" ]; then
  if [ -f "$ROOT_DIR/apps/api/prisma/.env.example" ]; then
    echo "==> .env missing; seeding from .env.example"
    cp "$ROOT_DIR/apps/api/prisma/.env.example" "$ROOT_DIR/apps/api/prisma/.env"
  else
    echo "DATABASE_URL=\"file:./dev.db\"" > "$ROOT_DIR/apps/api/prisma/.env"
    echo "JWT_SECRET=change_me_in_prod" >> "$ROOT_DIR/apps/api/prisma/.env"
  fi
fi

# 2) sync DB schema + generate client
echo "==> prisma db push + generate"
pnpm dlx prisma db push --schema "$ROOT_DIR/apps/api/prisma/schema.prisma" >/dev/null
pnpm dlx prisma generate   --schema "$ROOT_DIR/apps/api/prisma/schema.prisma" >/dev/null

# 3) build API
echo "==> build @repo/api"
pnpm -F @repo/api --silent build

# 4) run e2e to confirm baseline is healthy
echo "==> e2e @repo/api"
pnpm -F @repo/api --silent test:e2e

echo "✅ Baseline restore verified (all green)"