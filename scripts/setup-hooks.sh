#!/usr/bin/env bash
# scripts/setup-hooks.sh
# Installs the pre-push hook from scripts/pre-push.template.sh

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT_DIR}" ]]; then
  echo "ERROR: Not inside a git repository." >&2
  exit 1
fi

cd "$ROOT_DIR"

TEMPLATE="scripts/pre-push.template.sh"
HOOK=".git/hooks/pre-push"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "ERROR: $TEMPLATE not found" >&2
  exit 1
fi

mkdir -p ".git/hooks"
cp "$TEMPLATE" "$HOOK"
chmod +x "$HOOK"

echo "Installed pre-push hook ✅"
echo
echo "Override defaults with environment variables if desired:"
echo "  export ORG=demo"
echo "  export API_EMAIL=tester@example.com"
echo "  export API_PASS=password123"
echo
echo "Skip hook temporarily with:"
echo "  SKIP_E2E=1 git push"