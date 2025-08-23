/*
  Warnings:

  - A unique constraint covering the columns `[sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - The required column `sku` was added to the `Product` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "inventoryQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sku" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'active';

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE INDEX "Product_orgId_createdAt_idx" ON "public"."Product"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_orgId_status_idx" ON "public"."Product"("orgId", "status");

-- CreateIndex
CREATE INDEX "Product_orgId_sku_idx" ON "public"."Product"("orgId", "sku");
