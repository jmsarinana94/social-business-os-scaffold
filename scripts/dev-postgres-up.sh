#!/usr/bin/env bash
# scripts/dev-postgres-up.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1) Start Postgres
docker compose -f "${ROOT_DIR}/docker-compose.postgres.yml" up -d

# 2) Ensure env file exists
ENV_FILE="${ROOT_DIR}/apps/api/prisma/.env.postgres"
if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${ROOT_DIR}/apps/api/prisma/.env.postgres.example" "${ENV_FILE}"
  echo "Created ${ENV_FILE} (edit if needed)."
fi

# 3) Push schema + generate client using the Postgres schema
pushd "${ROOT_DIR}/apps/api" >/dev/null
echo "==> prisma db push (postgres)"
pnpm dlx prisma db push --schema prisma/schema.postgres.prisma

echo "==> prisma generate (postgres)"
pnpm dlx prisma generate --schema prisma/schema.postgres.prisma

popd >/dev/null

echo "✅ Postgres is up and Prisma schema is synced."
echo "Next: export DATABASE_URL from apps/api/prisma/.env.postgres OR run the API via:"
echo "  (cd apps/api && DATABASE_URL=\$(grep DATABASE_URL prisma/.env.postgres | cut -d'=' -f2-) pnpm start:dev)"