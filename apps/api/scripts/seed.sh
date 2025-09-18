/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const ORG = process.env.ORG || 'demo';
  const EMAIL = process.env.SEED_EMAIL || 'seed@example.com';
  const PASSWORD = process.env.SEED_PASSWORD || 'password';

  console.log('🔧 Seeding…');

  // Org
  await prisma.organization.upsert({
    where: { id: ORG },
    update: {},
    create: { id: ORG, name: ORG, slug: ORG },
  });
  console.log(`✓ Organization ${ORG}`);

  // User
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {},
    create: {
      email: EMAIL,
      name: 'Seed User',
      passwordHash,
    },
  });
  console.log(`✓ User ${EMAIL}`);

  // Membership (OWNER)
  await prisma.membership.upsert({
    where: { orgId_userId: { orgId: ORG, userId: user.id } },
    update: { role: 'OWNER' as any },
    create: { orgId: ORG, userId: user.id, role: 'OWNER' as any },
  });
  console.log('✓ Membership OWNER');

  // Product
  await prisma.product.upsert({
    where: { sku_orgId: { sku: 'SKU-SEED', orgId: ORG } },
    update: {},
    create: {
      orgId: ORG,
      sku: 'SKU-SEED',
      title: 'Seed Widget',
      type: 'physical' as any,
      status: 'active' as any,
      price: 25,
      inventoryQty: 100,
      description: 'Seeded product',
    },
  });
  console.log('✓ Product SKU-SEED');

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });