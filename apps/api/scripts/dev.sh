#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# build & run the API on port 4000
pnpm build

# kill anything on 4000, then start
lsof -ti :4000 | xargs -r kill -9 || true

pnpm start