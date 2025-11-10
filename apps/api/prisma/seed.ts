// apps/api/prisma/seed.ts
import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// -----------------------------
// Config
// -----------------------------
const EMAIL = process.env.SEED_EMAIL ?? 'tester@example.com';
const PASS = process.env.SEED_PASSWORD ?? 'password123';

const ORG_SLUG = process.env.SEED_ORG_SLUG ?? 'demo-9bsfct';
const ORG_NAME = process.env.SEED_ORG_NAME ?? 'Demo Org';

const DEFAULT_CATEGORY = process.env.SEED_CATEGORY ?? 'General';

// -----------------------------
// Helpers
// -----------------------------
const dec = (n: number | string) => new Prisma.Decimal(n);

// -----------------------------
// Main seed
// -----------------------------
async function main() {
  // 1) User (hash password on every run to keep it current)
  const passwordHash = await bcrypt.hash(PASS, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash },
    create: { email: EMAIL, passwordHash },
    select: { id: true, email: true },
  });

  // 2) Organization
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: { name: ORG_NAME },
    create: { slug: ORG_SLUG, name: ORG_NAME },
    select: { id: true, slug: true, name: true },
  });

  // 3) Membership (ADMIN)
  await prisma.orgMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: { role: 'ADMIN' },
    create: { organizationId: org.id, userId: user.id, role: 'ADMIN' },
  });

  // 4) Default Category
  const category = await prisma.category.upsert({
    where: { organizationId_name: { organizationId: org.id, name: DEFAULT_CATEGORY } },
    update: {},
    create: {
      organizationId: org.id,
      name: DEFAULT_CATEGORY,
      description: 'Default category',
    },
    select: { id: true, name: true },
  });

  // 5) Products (idempotent via composite unique organizationId+sku)
  const products = [
    {
      sku: 'SEED-SKU-001',
      title: 'Seed Hoodie',
      price: dec(59.99),
      inventoryQty: 10,
      type: 'PHYSICAL' as const,
      status: 'ACTIVE' as const,
    },
    {
      sku: 'SEED-SKU-002',
      title: 'Seed Cap',
      price: dec(24.99),
      inventoryQty: 30,
      type: 'PHYSICAL' as const,
      status: 'ACTIVE' as const,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { organizationId_sku: { organizationId: org.id, sku: p.sku } },
      update: {
        title: p.title,
        description: null,
        price: p.price,
        status: p.status,
        type: p.type,
        inventoryQty: p.inventoryQty,
        categoryId: category.id,
      },
      create: {
        organizationId: org.id,
        categoryId: category.id,
        sku: p.sku,
        title: p.title,
        description: null,
        price: p.price,
        status: p.status,
        type: p.type,
        inventoryQty: p.inventoryQty,
      },
    });
  }

  console.log('✅ Seed complete:', {
    org,
    user,
    category,
    products: products.map((p) => p.sku),
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });