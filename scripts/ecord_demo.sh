#!/usr/bin/env bash
set -Eeuo pipefail
# Placeholder: runs the golden path with timestamps; pipe to asciinema, sim
pushd "$(dirname "$0")/.." >/dev/null
source ./api.sh
login_api
seed_demo_data ORGDEMO-MUG-GREEN "Green Mug" 13.50 25
seed_plain_mug
demo_flow
popd >/dev/null
echo "🎥 Demo actions executed. Use asciinema/ttyd/OBS to capture terminal."