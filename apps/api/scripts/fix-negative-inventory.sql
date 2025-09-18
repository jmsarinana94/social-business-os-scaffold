-- One-time cleanup you can run safely any time
UPDATE "Product"
SET "inventoryQty" = 0
WHERE "inventoryQty" < 0;