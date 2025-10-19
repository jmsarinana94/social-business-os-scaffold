-- Create enums if missing
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

-- Normalize any lowercase legacy values (safety)
UPDATE "Product" SET "type" = UPPER("type")   WHERE "type"   ~ '^[a-z]';
UPDATE "Product" SET "status" = UPPER("status") WHERE "status" ~ '^[a-z]';

-- Convert columns to ENUMs using safe casts from current text/varchar
ALTER TABLE "Product"
  ALTER COLUMN "type"   TYPE "ProductType"   USING ("type"::text)::"ProductType",
  ALTER COLUMN "status" TYPE "ProductStatus" USING ("status"::text)::"ProductStatus";

-- Enforce NOT NULL and defaults to match Prisma schema
ALTER TABLE "Product"
  ALTER COLUMN "type"   SET NOT NULL,
  ALTER COLUMN "type"   SET DEFAULT 'PHYSICAL'::"ProductType",
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"ProductStatus";