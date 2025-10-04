// apps/api/prisma/seed.ts
import { PrismaClient, ProductStatus, ProductType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const API_EMAIL = process.env.API_EMAIL ?? 'you@example.com';
  const API_PASS  = process.env.API_PASS  ?? 'test1234';

  // 1) Organization (by slug 'org_demo')
  const org = await prisma.organization.upsert({
    where: { slug: 'org_demo' },
    update: {},
    create: { slug: 'org_demo', name: 'Demo Org' },
  });

  // 2) User (bcrypt hash in `password`)
  const password = await bcrypt.hash(API_PASS, 10);
  await prisma.user.upsert({
    where: { email: API_EMAIL },
    update: { password },
    create: { email: API_EMAIL, password },
  });

  // 3) Products for that org
  const products = [
    {
      orgId: org.id,
      sku: 'MUG-GREEN',
      title: 'Green Mug',
      price: 13.5,
      type: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      inventoryQty: 25,
      description: '12oz ceramic mug in green.',
    },
    {
      orgId: org.id,
      sku: 'TSHIRT-BLK-M',
      title: 'T-Shirt Black (M)',
      price: 24.0,
      type: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      inventoryQty: 50,
      description: 'Unisex tee, black, size M.',
    },
    {
      orgId: org.id,
      sku: 'EBOOK-START',
      title: 'Starter eBook',
      price: 9.99,
      type: ProductType.DIGITAL,
      status: ProductStatus.INACTIVE, // ARCHIVED is not in your DB enum
      inventoryQty: 0,
      description: 'PDF download.',
    },
  ] as const;

  // IMPORTANT: use the generated @@unique selector name: Product_orgId_sku_key
  for (const p of products) {
    await prisma.product.upsert({
      where: { Product_orgId_sku_key: { orgId: p.orgId, sku: p.sku } },
      update: {
        title: p.title,
        price: p.price,
        type: p.type,
        status: p.status,
        inventoryQty: p.inventoryQty,
        description: p.description,
      },
      create: { ...p },
    });
  }

  console.log('✅ Seed complete: org (org_demo), user, products');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });