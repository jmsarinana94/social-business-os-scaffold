#!/usr/bin/env bash
# apps/api/scripts/fix-negative-inventory.sh
set -euo pipefail

# Move to the API app directory (so .env/.envrc load if you use direnv)
cd "$(dirname "$0")/.."

# Ensure DATABASE_URL is present (from your .env or shell)
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set. Export it or create apps/api/.env with DATABASE_URL."
  exit 1
fi

# Require psql to be available
if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is not installed or not in PATH."
  echo "On macOS: brew install libpq && echo 'export PATH=\"/opt/homebrew/opt/libpq/bin:$PATH\"' >> ~/.zshrc"
  exit 1
fi

echo "→ Fixing negative inventory (setting any inventoryQty < 0 to 0)…"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "./scripts/fix-negative-inventory.sql"
echo "✓ Done."