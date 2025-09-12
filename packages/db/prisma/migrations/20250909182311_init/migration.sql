-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('physical', 'digital');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "orgId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "public"."ProductType" NOT NULL,
    "description" TEXT,
    "price" DECIMAL(30,2) NOT NULL,
    "sku" VARCHAR(64),
    "inventoryQty" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "Product_orgId_createdAt_idx" ON "public"."Product"("orgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_org_sku_unique" ON "public"."Product"("orgId", "sku");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
