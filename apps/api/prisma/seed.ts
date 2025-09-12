// prisma/seed.ts
import { $Enums, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { slug: 'acme', name: 'Acme Co.' },
  });

  await prisma.product.createMany({
    data: [
      {
        orgId: org.id,
        title: 'Cap',
        type: $Enums.ProductType.PHYSICAL,
        status: $Enums.ProductStatus.ACTIVE,
        price: new Prisma.Decimal('14.99'),
        sku: 'CAP-001',
        description: 'Black dad hat',
        inventoryQty: 0,
      },
      {
        orgId: org.id,
        title: 'Beanie',
        type: $Enums.ProductType.PHYSICAL,
        status: $Enums.ProductStatus.ACTIVE,
        price: new Prisma.Decimal('12.00'),
        sku: 'BEAN-001',
        description: 'Warm beanie',
        inventoryQty: 0,
      },
      {
        orgId: org.id,
        title: 'Sticker',
        type: $Enums.ProductType.DIGITAL,
        status: $Enums.ProductStatus.ACTIVE,
        price: new Prisma.Decimal('9.99'),
        sku: 'STICK-001',
        description: 'Digital sticker pack',
        inventoryQty: 0,
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });