#!/usr/bin/env bash
# apps/api/scripts/e2e-mac.sh
# Runs e2e with macOS-safe TMPDIR + explicit jest cache
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p .tmp/jest-cache
TMPDIR="$(pwd)/.tmp" \
API_EMAIL="${API_EMAIL:-tester@example.com}" \
API_PASS="${API_PASS:-password123}" \
ORG="${ORG:-demo}" \
pnpm -F @repo/api test:e2e --cacheDirectory "$(pwd)/.tmp/jest-cache"