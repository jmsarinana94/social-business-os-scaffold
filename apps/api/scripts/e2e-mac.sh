#!/usr/bin/env bash
set -euo pipefail

# Always run from apps/api/
cd "$(dirname "$0")/.."

echo "==> prisma generate"
pnpm prisma generate --schema=prisma/schema.prisma

echo "==> prisma db push"
pnpm prisma db push

echo "==> prisma seed (demo tester)"
ORG=demo API_EMAIL="tester@example.com" API_PASS="password123" pnpm prisma db seed

mkdir -p .tmp/jest-cache
echo "==> e2e tests"
TMPDIR="$(pwd)/.tmp" \
pnpm -F @repo/api test:e2e -- --runInBand --cacheDirectory "$(pwd)/.tmp/jest-cache"
