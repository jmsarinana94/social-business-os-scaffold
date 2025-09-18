#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ prisma generate"
pnpm prisma generate --schema=prisma/schema.prisma

echo "→ prisma db push"
pnpm prisma db push --schema=prisma/schema.prisma

echo "→ seed demo org + user"
# Pass both API_* and SEED_* so any seed path works
ORG="${ORG:-demo}" \
SEED_ORG_SLUG="${SEED_ORG_SLUG:-$ORG}" \
SEED_ORG_NAME="${SEED_ORG_NAME:-Demo Org}" \
API_EMAIL="${API_EMAIL:-tester@example.com}" \
API_PASS="${API_PASS:-secret123}" \
SEED_EMAIL="${SEED_EMAIL:-$API_EMAIL}" \
SEED_PASSWORD="${SEED_PASSWORD:-$API_PASS}" \
pnpm prisma db seed --schema=prisma/schema.prisma