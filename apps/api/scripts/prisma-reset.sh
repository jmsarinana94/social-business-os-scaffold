#!/usr/bin/env bash
# apps/api/scripts/prisma-reset.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ migrate reset (no prompts)"
pnpm prisma migrate reset --force --skip-generate --skip-seed

echo "→ db push (recreate tables)"
pnpm prisma db push

echo "→ seed demo org + user"
ORG="${ORG:-demo}" API_EMAIL="${API_EMAIL:-tester@example.com}" API_PASS="${API_PASS:-password123}" \
pnpm prisma db seed