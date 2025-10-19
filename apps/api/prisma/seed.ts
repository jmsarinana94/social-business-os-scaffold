// apps/api/prisma/seed.ts
import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const EMAIL = process.env.SEED_EMAIL ?? 'tester@example.com';
const PASS = process.env.SEED_PASSWORD ?? 'password123';
const ORG_SLUG = process.env.SEED_ORG_SLUG ?? 'demo-9bsfct';
const ORG_NAME = process.env.SEED_ORG_NAME ?? 'Demo Org';

async function main() {
  // 1) User with passwordHash
  const passwordHash = await bcrypt.hash(PASS, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash },
    create: { email: EMAIL, passwordHash },
    select: { id: true, email: true },
  });

  // 2) Organization (slug + name are required)
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: { name: ORG_NAME },
    create: { slug: ORG_SLUG, name: ORG_NAME },
    select: { id: true, slug: true, name: true },
  });

  // 3) Membership (use organizationId only)
  const existingMember = await prisma.orgMember.findFirst({
    where: { userId: user.id, organizationId: org.id },
  });

  if (!existingMember) {
    await prisma.orgMember.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'ADMIN',
      },
    });
  }

  // 4) Seed product for this org (match on organizationId + sku)
  const SEED_SKU = 'SEED-SKU-001';

  const existingProduct = await prisma.product.findFirst({
    where: { sku: SEED_SKU, organizationId: org.id },
  });

  if (existingProduct) {
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        title: 'Seed Hoodie',
        status: 'ACTIVE',
        price: new Prisma.Decimal(59.99),
        inventoryQty: 10,
        type: 'PHYSICAL',
      },
    });
  } else {
    await prisma.product.create({
      data: {
        sku: SEED_SKU,
        title: 'Seed Hoodie',
        description: null,
        type: 'PHYSICAL',
        status: 'ACTIVE',
        price: new Prisma.Decimal(59.99),
        inventoryQty: 10,
        organizationId: org.id,
      },
    });
  }

  console.log({ ok: true, org, user });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });