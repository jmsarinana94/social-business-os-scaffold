// packages/db/prisma/seed.ts
import { $Enums, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ensure orgs exist (stable slugs)
  const orgs = [
    { slug: 'acme', name: 'Acme Co.' },
    { slug: 'demo', name: 'Demo Org' },
  ];

  for (const o of orgs) {
    await prisma.organization.upsert({
      where: { slug: o.slug },
      update: { name: o.name },
      create: { slug: o.slug, name: o.name },
    });
  }

  // Get org ids (use slug to avoid hardcoding UUIDs)
  const acme = await prisma.organization.findUniqueOrThrow({ where: { slug: 'acme' } });
  const demo = await prisma.organization.findUniqueOrThrow({ where: { slug: 'demo' } });

  // Clean existing demo data for reproducible seeds (optional)
  // Comment these deletes if you want to keep existing records
  await prisma.product.deleteMany({ where: { orgId: { in: [acme.id, demo.id] } } });

  // Seed products
  const products = [
    {
      orgId: acme.id,
      title: 'Cap',
      description: 'Black dad hat',
      price: new Prisma.Decimal('14.99'),
      sku: 'CAP-001',
      type: $Enums.ProductType.PHYSICAL,
      status: $Enums.ProductStatus.ACTIVE,
    },
    {
      orgId: acme.id,
      title: 'Beanie',
      description: 'Warm knit beanie',
      price: new Prisma.Decimal('12.00'),
      sku: 'BEAN-001',
      type: $Enums.ProductType.PHYSICAL,
      status: $Enums.ProductStatus.ACTIVE,
    },
    {
      orgId: acme.id,
      title: 'Hoodie',
      description: 'Cozy fleece hoodie',
      price: new Prisma.Decimal('39.99'),
      sku: 'HOOD-001',
      type: $Enums.ProductType.PHYSICAL,
      status: $Enums.ProductStatus.ACTIVE,
    },
    // Example shared SKU to test the unique(orgId, sku) works per org:
    {
      orgId: demo.id,
      title: 'Hoodie',
      description: 'Demo Hoodie',
      price: new Prisma.Decimal('29.99'),
      sku: 'HOOD-001', // Allowed because orgId differs
      type: $Enums.ProductType.PHYSICAL,
      status: $Enums.ProductStatus.ACTIVE,
    },
  ] as const;

  // Create
  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log('🌱 Seeded organizations and products');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });