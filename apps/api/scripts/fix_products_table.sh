#!/usr/bin/env bash
set -euo pipefail

echo "== ENV =="
echo "DATABASE_URL=${DATABASE_URL:-<unset>}"
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is not set in this shell. Source your .env/.envrc first."
  exit 1
fi

echo; echo "== DB identity =="
pnpm -F @repo/api prisma db execute --url "$DATABASE_URL" --stdin <<'SQL'
SELECT
  current_database() AS db,
  current_user AS db_user,
  current_schema AS schema,
  current_setting('search_path') AS search_path;
SQL

echo; echo "== BEFORE: Product column types =="
pnpm -F @repo/api prisma db execute --url "$DATABASE_URL" --stdin <<'SQL'
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'Product'
ORDER BY ordinal_position;
SQL

echo; echo "== APPLY: enums + price numeric (idempotent) =="
pnpm -F @repo/api prisma db execute --url "$DATABASE_URL" --stdin <<'SQL'
-- 1) Ensure enums exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductType') THEN
    CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductStatus') THEN
    CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;
END
$$;

-- 2) Normalize any lowercase values
UPDATE "Product" SET "type"   = UPPER("type")   WHERE "type"   ~ '^[a-z]';
UPDATE "Product" SET "status" = UPPER("status") WHERE "status" ~ '^[a-z]';

-- 3) Force enum columns
ALTER TABLE "Product"
  ALTER COLUMN "type"   TYPE "ProductType"   USING ("type"::text)::"ProductType",
  ALTER COLUMN "status" TYPE "ProductStatus" USING ("status"::text)::"ProductStatus";

-- 4) Force price to numeric(10,2) (robust swap if it's not numeric yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='Product' AND column_name='price' AND data_type <> 'numeric'
  ) THEN
    ALTER TABLE "Product" ADD COLUMN "price_num" numeric(10,2);
    UPDATE "Product" SET "price_num" = NULLIF(TRIM("price"::text), '')::numeric(10,2);
    ALTER TABLE "Product" DROP COLUMN "price";
    ALTER TABLE "Product" RENAME COLUMN "price_num" TO "price";
  END IF;
END
$$;

-- 5) Constraints / defaults to match Prisma
ALTER TABLE "Product"
  ALTER COLUMN "type"   SET NOT NULL,
  ALTER COLUMN "type"   SET DEFAULT 'PHYSICAL'::"ProductType",
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"ProductStatus",
  ALTER COLUMN "price"  SET NOT NULL;
SQL

echo; echo "== AFTER: Product column types =="
pnpm -F @repo/api prisma db execute --url "$DATABASE_URL" --stdin <<'SQL'
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'Product'
ORDER BY ordinal_position;
SQL

echo; echo "== Prisma client regen =="
pnpm -F @repo/api prisma generate > /dev/null

echo; echo "== Quick API poke =="
BASE="${BASE:-http://localhost:4010/v1}"
echo "BASE=$BASE"
curl -s "$BASE/products" | jq 'if type=="array" then "OK-array" else . end'
