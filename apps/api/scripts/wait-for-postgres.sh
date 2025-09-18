#!/usr/bin/env bash
set -euo pipefail

host=${1:-localhost}
port=${2:-5432}

echo "Waiting for Postgres at $host:$port ..."
until nc -z "$host" "$port"; do
  sleep 0.5
done
echo "Postgres is up."