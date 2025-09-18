-- Ensure no negative inventory remains before adding the constraint
UPDATE "Product"
SET "inventoryQty" = 0
WHERE "inventoryQty" < 0;

-- Add a guardrail so inventory can never go below zero again
ALTER TABLE "Product"
ADD CONSTRAINT product_inventory_qty_nonnegative
CHECK ("inventoryQty" >= 0);