// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orgId = 'demo';

  // If there are no products for this org yet, seed a few
  const existing = await prisma.product.count({ where: { orgId } });
  if (existing === 0) {
    await prisma.product.createMany({
      data: [
        {
          orgId,
          title: 'Demo product',
          type: 'physical',
          description: 'Just a demo row',
          price: 1999,
          sku: 'DEMO-1',
          inventoryQty: 10,
          status: 'active',
        },
        {
          orgId,
          title: 'Blue Shirt',
          type: 'physical',
          description: 'Cotton shirt, size M',
          price: 2499,
          sku: 'SHIRT-BLUE-M',
          inventoryQty: 25,
          status: 'active',
        },
        {
          orgId,
          title: 'E-book: Growth Tactics',
          type: 'digital',
          description: 'PDF download',
          price: 999,
          sku: 'EBOOK-GROWTH',
          inventoryQty: 0,
          status: 'active',
        },
      ],
    });
     
    console.log('Seeded demo products for org:', orgId);
  } else {
     
    console.log(`Org ${orgId} already has ${existing} product(s); skipping seed.`);
  }
}

main()
  .catch((e) => {
     
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });