#!/usr/bin/env bash
set -euo pipefail

ITER="${1:-5}"
SLEEP_SEC="${2:-1}"

for ((i=1; i<=ITER; i++)); do
  echo
  echo "==> Run $i"
  ./run_demo_once.sh 2 19.99
  if (( i < ITER )); then
    sleep "${SLEEP_SEC}"
  fi
done