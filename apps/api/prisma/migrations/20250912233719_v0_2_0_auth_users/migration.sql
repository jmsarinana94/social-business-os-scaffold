/*
  Warnings:

  - You are about to drop the `OrgUser` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `price` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- DropForeignKey
ALTER TABLE "public"."OrgUser" DROP CONSTRAINT "OrgUser_orgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrgUser" DROP CONSTRAINT "OrgUser_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Organization" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "inventoryQty" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "price",
ADD COLUMN     "price" DECIMAL(12,2) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "email" SET DATA TYPE CITEXT;

-- DropTable
DROP TABLE "public"."OrgUser";

-- CreateTable
CREATE TABLE "public"."Membership" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Membership_user_idx" ON "public"."Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_orgId_userId_key" ON "public"."Membership"("orgId", "userId");

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."Product_orgId_createdAt_idx" RENAME TO "Product_org_createdAt_idx";

-- RenameIndex
ALTER INDEX "public"."Product_orgId_status_idx" RENAME TO "Product_org_status_idx";
