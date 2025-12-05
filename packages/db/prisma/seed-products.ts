// packages/db/prisma/seed-products.ts
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ProductSeed = {
  title: string;
  description: string;
  price: number | string;
  type: 'PHYSICAL' | 'DIGITAL';
  status: 'ACTIVE' | 'INACTIVE';
  sku: string;
};

/**
 * Convert a string or number into a Prisma.Decimal
 */
function toDecimal(value: ProductSeed['price']): Prisma.Decimal {
  return new Prisma.Decimal(typeof value === 'number' ? value.toFixed(2) : value);
}

async function main(): Promise<void> {
  console.log('🌱 Seeding demo products...');

  const org = await prisma.organization.findUnique({
    where: { slug: 'demo' },
    select: { id: true },
  });

  if (!org) {
    throw new Error('Demo organization not found. Run: pnpm run db:seed:demo');
  }

  const items: ProductSeed[] = [
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

  for (const item of items) {
    // Idempotent upsert by SKU
    await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        title: item.title,
        description: item.description,
        price: toDecimal(item.price),
        status: item.status,
        type: item.type,
        orgId: org.id,
      },
      create: {
        orgId: org.id,
        title: item.title,
        description: item.description,
        price: toDecimal(item.price),
        status: item.status,
        type: item.type,
        sku: item.sku,
      },
    });

    console.log(`✅ Upserted: ${item.title} (${item.sku})`);
  }

  console.log('🌱 Done seeding products.');
}

main()
  .catch((err: unknown) => {
     
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });