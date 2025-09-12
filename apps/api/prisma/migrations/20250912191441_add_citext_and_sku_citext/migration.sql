-- Enable case-insensitive text type
CREATE EXTENSION IF NOT EXISTS citext;

-- Make Product.sku case-insensitive
ALTER TABLE "Product"
  ALTER COLUMN "sku" TYPE CITEXT USING "sku"::citext;

-- If you previously had a unique index on sku alone, keep the composite one.
-- Safe no-ops if they already match your prior migrations.
-- DROP INDEX IF EXISTS "Product_sku_key";
-- CREATE UNIQUE INDEX IF NOT EXISTS "Product_orgId_sku_key" ON "Product"("orgId","sku");