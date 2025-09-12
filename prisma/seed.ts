// prisma/seed.ts
/**
 * Idempotent seeding for Organizations and some demo Products.
 * - Uses composite unique key (orgId, sku) to avoid duplicates.
 * - Accepts string decimals for price, Prisma will coerce to Decimal.
 */

import { $Enums, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertOrg(slug: string, name: string) {
  return prisma.organization.upsert({
    where: { slug },
    update: { name },
    create: { slug, name },
  });
}

async function upsertProduct(args: {
  orgId: string;
  sku: string;
  title: string;
  description?: string | null;
  price: string; // pass as string to be safe with Decimal
  type: $Enums.ProductType; // 'PHYSICAL' | 'DIGITAL'
  status?: $Enums.ProductStatus; // 'ACTIVE' | 'INACTIVE'
  inventoryQty?: number;
}) {
  const {
    orgId,
    sku,
    title,
    description = null,
    price,
    type,
    status = $Enums.ProductStatus.ACTIVE,
    inventoryQty = 0,
  } = args;

  // Uses the composite unique index: @@unique([orgId, sku])
  return prisma.product.upsert({
    where: { orgId_sku: { orgId, sku } },
    update: {
      title,
      description,
      price,
      type,
      status,
      inventoryQty,
    },
    create: {
      orgId,
      sku,
      title,
      description,
      price,
      type,
      status,
      inventoryQty,
    },
  });
}

async function main() {
  console.log('🌱 Seeding…');

  const acme = await upsertOrg('acme', 'Acme Co.');
  const demo = await upsertOrg('demo', 'Demo Org');

  // Seed some products for Acme
  await Promise.all([
    upsertProduct({
      orgId: acme.id,
      sku: 'HOOD-001',
      title: 'Hoodie',
      description: 'Cozy fleece hoodie',
      price: '39.99',
      type: $Enums.ProductType.PHYSICAL,
      status: $Enums.ProductStatus.ACTIVE,
    }),
    upsertProduct({
      orgId: acme.id,
      sku: 'BEAN-001',
      title: 'Beanie',
      description: 'Warm knit beanie',
      price: '12.00',
      type: $Enums.ProductType.PHYSICAL,
      status: $Enums.ProductStatus.ACTIVE,
    }),
    upsertProduct({
      orgId: acme.id,
      sku: 'CAP-001',
      title: 'Cap',
      description: 'Black dad hat',
      price: '14.99',
      type: $Enums.ProductType.PHYSICAL,
      status: $Enums.ProductStatus.ACTIVE,
    }),
  ]);

  // Optionally seed one item for Demo org too
  await upsertProduct({
    orgId: demo.id,
    sku: 'SW-001',
    title: 'Demo Sticker',
    description: 'Logo sticker',
    price: '3.50',
    type: $Enums.ProductType.DIGITAL, // could be PHYSICAL if you prefer
    status: $Enums.ProductStatus.ACTIVE,
  });

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });