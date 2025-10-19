#!/usr/bin/env bash
set -Eeuo pipefail
pushd "$(dirname "$0")/.." >/dev/null
source ./api.sh
login_api
require_org
pid_by_sku ORGDEMO-MUG-GREEN >/dev/null
for i in {1..20}; do
  order "$PID" 1 19.99 >/dev/null || true
done
products_min
popd >/dev/null
echo "✅ Load test complete (20 orders attempted)."