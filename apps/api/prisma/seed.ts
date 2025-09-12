// prisma/seed.ts
 
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.API_EMAIL || 'demo@demo.io';
  const passwordPlain = process.env.API_PASS || 'pass123';
  const orgSlug = process.env.ORG || 'demo';

  const password = await bcrypt.hash(passwordPlain, 10);

  // org
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    create: { slug: orgSlug, name: 'Demo Org' },
    update: {},
  });

  // user
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: 'Demo', password },
    update: {},
  });

  // membership
  await prisma.orgUser.upsert({
    where: { orgId_userId: { orgId: org.id, userId: user.id } },
    create: { orgId: org.id, userId: user.id, role: 'ADMIN' },
    update: {},
  });

  // product (idempotent by (orgId, sku))
  await prisma.product.upsert({
    where: { orgId_sku: { orgId: org.id, sku: 'SKU-1' } },
    create: {
      orgId: org.id,
      sku: 'SKU-1',
      title: 'Widget A',
      type: 'PHYSICAL',
      status: 'ACTIVE',
      price: '19.99',
      description: 'Seeded item',
    },
    update: {},
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });