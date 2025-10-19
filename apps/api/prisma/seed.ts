// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ORG_SLUG = process.env.SEED_ORG_SLUG || 'demo-9bsfct';
const ORG_NAME = process.env.SEED_ORG_NAME || 'demo';
const EMAIL    = process.env.SEED_EMAIL    || 'tester@example.com';
const PASS     = process.env.SEED_PASS     || 'password123';

async function main() {
  // 1) Organization (slug is required in your schema)
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: { name: ORG_NAME },
    create: { slug: ORG_SLUG, name: ORG_NAME },
  });

  // 2) User (your model uses `password` and does NOT have `name` or `passwordHash`)
  const password = await bcrypt.hash(PASS, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { password },
    create: { email: EMAIL, password },
  });

  // 3) Membership (unique on (userId, orgId))
  await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    update: { role: 'ADMIN' },
    create: { userId: user.id, orgId: org.id, role: 'ADMIN' },
  });

  // 4) Demo product (compound unique on (orgId, sku))
  await prisma.product.upsert({
    where: { orgId_sku: { orgId: org.id, sku: 'SEED-SKU-001' } },
    update: {}, // nothing to change if it exists
    create: {
      orgId: org.id,
      sku: 'SEED-SKU-001',
      title: 'Seed Hoodie',
      type: 'PHYSICAL',
      status: 'ACTIVE',
      price: 59.99,
      inventoryQty: 10,
    },
  });

  console.log({
    ok: true,
    org: { id: org.id, slug: org.slug },
    user: { id: user.id, email: user.email },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });