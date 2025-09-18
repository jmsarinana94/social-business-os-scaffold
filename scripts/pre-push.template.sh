#!/usr/bin/env bash
# scripts/pre-push.template.sh
# Runs Prisma generate/push, seeds demo user, and executes e2e tests before pushes.
# Fails the push if any step fails.

set -euo pipefail

# ---- Helper: log ------------------------------------------
log() { printf "\n==> %s\n" "$*"; }

# ---- Resolve repo root ------------------------------------
if ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  cd "$ROOT_DIR"
else
  echo "ERROR: Not inside a git repository." >&2
  exit 1
fi

# ---- Sanity checks ----------------------------------------
command -v pnpm >/dev/null 2>&1 || { echo "ERROR: pnpm is required (https://pnpm.io/installation)"; exit 1; }

API_DIR="apps/api"
[ -d "$API_DIR" ] || { echo "ERROR: $API_DIR not found"; exit 1; }

# ---- Config (overridable via env) -------------------------
EMAIL="${API_EMAIL:-tester@example.com}"
PASS="${API_PASS:-password123}"
ORG="${ORG:-demo}"

# Allow skipping via an env var (e.g. SKIP_E2E=1 git push)
if [[ "${SKIP_E2E:-}" == "1" ]]; then
  echo "pre-push: skipping e2e because SKIP_E2E=1"
  exit 0
fi

# macOS-friendly TMP layout for Jest
CACHE_ROOT="$API_DIR/.tmp"
CACHE_DIR="$CACHE_ROOT/jest-cache"
mkdir -p "$CACHE_DIR"

# ---- Prisma + Seed ----------------------------------------
pushd "$API_DIR" >/dev/null

log "prisma generate"
pnpm prisma generate --schema=prisma/schema.prisma

log "prisma db push"
pnpm prisma db push

log "prisma seed (demo ${EMAIL})"
# Uses apps/api/.env to find DATABASE_URL
ORG="$ORG" API_EMAIL="$EMAIL" API_PASS="$PASS" pnpm prisma db seed

# ---- e2e Tests --------------------------------------------
log "e2e tests"
# Single `--` (important) and explicit cache directory
TMPDIR="$(pwd)/.tmp" pnpm -F @repo/api test:e2e -- --runInBand --cacheDirectory "$CACHE_DIR"

popd >/dev/null

echo "pre-push: ✅ all good"