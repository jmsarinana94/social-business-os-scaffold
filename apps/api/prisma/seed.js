// apps/api/prisma/seed.js
/* CommonJS so it runs with plain `node` (no ts-node needed) */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function sku(prefix = 'SKU') {
  const rand = Math.random().toString(36).slice(2, 8);
  const num = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `${prefix}-${rand}-${num}`;
}

async function main() {
  const ORG = process.env.ORG || 'demo-org';
  const API_EMAIL = process.env.API_EMAIL || 'demo@example.com';
  const API_PASS = process.env.API_PASS || 'demo-password';
  const ORG_NAME = process.env.ORG_NAME || 'Demo Organization';

  console.log('Using:');
  console.log('  ORG       =', ORG);
  console.log('  API_EMAIL =', API_EMAIL);
  console.log('  API_PASS  =', API_PASS.replace(/./g, '*'));

  // 1) Upsert Organization by slug
  const org = await prisma.organization.upsert({
    where: { slug: ORG },
    update: { name: ORG_NAME },
    create: { slug: ORG, name: ORG_NAME },
  });
  console.log('✔ Org ready:', org.slug, org.id);

  // 2) Upsert User by email (hash password)
  const passwordHash = bcrypt.hashSync(API_PASS, 10);
  const user = await prisma.user.upsert({
    where: { email: API_EMAIL },
    update: { password: passwordHash, name: 'API User' },
    create: {
      email: API_EMAIL,
      name: 'API User',
      password: passwordHash,
      // If your schema relates users to an org, include the connect here:
      // org: { connect: { id: org.id } },
    },
  });
  console.log('✔ User ready:', user.email);

  // 3) Seed a few products (idempotent on (orgId, sku) if you re-run with new SKUs)
  const productsPayload = [
    {
      title: 'Widget',
      type: 'PHYSICAL',
      status: 'ACTIVE',
      price: 1299, // If your Prisma model is Decimal, you can pass a number/string
      description: 'A useful widget',
      sku: sku('SKU-W'),
    },
    {
      title: 'Pro Subscription',
      type: 'DIGITAL',
      status: 'ACTIVE',
      price: 4999,
      description: 'One-year subscription',
      sku: sku('SKU-PRO'),
    },
    {
      title: 'Consulting',
      type: 'DIGITAL',
      status: 'INACTIVE',
      price: 10000,
      description: 'Hourly consulting pack',
      sku: sku('SKU-CONSULT'),
    },
  ];

  for (const p of productsPayload) {
    const created = await prisma.product.create({
      data: {
        title: p.title,
        type: p.type, // 'PHYSICAL' | 'DIGITAL'
        status: p.status, // 'ACTIVE' | 'INACTIVE'
        price: p.price, // Decimal-compatible (number/string)
        description: p.description ?? null,
        sku: p.sku,
        org: { connect: { id: org.id } },
      },
    });
    console.log('✔ Product:', created.title, created.sku);
  }

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });