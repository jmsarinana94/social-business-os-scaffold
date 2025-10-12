#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB="$ROOT_DIR/apps/api/prisma/dev.db"
OUT_DIR="$ROOT_DIR/backups"
STAMP="$(date +'%Y%m%d-%H%M%S')"
OUT="$OUT_DIR/dev-$STAMP.db"

mkdir -p "$OUT_DIR"

if [ -f "$DB" ]; then
  cp "$DB" "$OUT"
  echo "✅ Saved backup: $OUT"
else
  echo "No dev.db found at: $DB"
fi