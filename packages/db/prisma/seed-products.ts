// packages/db/prisma/seed-products.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo products...');
  const org = await prisma.organization.findUnique({
    where: { slug: 'demo' },
    select: { id: true },
  });

  if (!org) {
    throw new Error('Demo organization not found. Run: pnpm run db:seed:demo');
  }

  const items = [
    {
      title: 'Sticker',
      description: 'Vinyl',
      price: '2.50',
      type: 'PHYSICAL',
      status: 'ACTIVE',
      sku: 'STK-001',
    },
    {
      title: 'Test Tee',
      description: 'Soft cotton T-shirt',
      price: '19.99',
      type: 'PHYSICAL',
      status: 'ACTIVE',
      sku: 'TEE-001',
    },
    {
      title: 'Mug',
      description: 'Ceramic 11oz',
      price: '9.99',
      type: 'PHYSICAL',
      status: 'ACTIVE',
      sku: 'MUG-001',
    },
  ];

  // Upsert each so the script is idempotent
  for (const item of items) {
  await prisma.product.upsert({
    where: { sku: item.sku }, // <- use sku (unique)
    update: {
      title: item.title,
      description: item.description,
      price: item.price,
      status: item.status.toLowerCase() as any,
      type: item.type.toLowerCase() as any,
      orgId: org.id, // keep it aligned if org changed
    },
    create: {
      orgId: org.id,
      title: item.title,
      description: item.description,
      price: item.price,
      status: item.status.toLowerCase() as any,
      type: item.type.toLowerCase() as any,
      sku: item.sku,
    },
  });
}

  console.log('✅ Products seeded/updated');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });