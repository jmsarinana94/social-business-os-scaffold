 
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const orgSlug = process.env.ORG || 'demo';
  const email = process.env.API_EMAIL || 'tester@example.com';
  const password = process.env.API_PASS || 'password123';

  // Upsert org
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: { slug: orgSlug, name: 'Demo Org' },
  });

  // Upsert user (hashed password)
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    // 👉 if the user exists, force-update the password to what we set
    update: { password: hash },
    create: { email, password: hash },
  });

  // Ensure membership (OWNER)
  await prisma.orgMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: user.id } },
    update: { role: 'OWNER' },
    create: { orgId: org.id, userId: user.id, role: 'OWNER' },
  });

  // Seed a few products (idempotent on org+sku)
  const products = [
    { title: 'Widget',          sku: 'WID-001',   type: 'PHYSICAL', status: 'ACTIVE', price: 12.34,  inventoryQty: 25 },
    { title: 'Pro Subscription',sku: 'SUB-PRO',   type: 'DIGITAL',  status: 'ACTIVE', price: 29.0,   inventoryQty: 0  },
    { title: 'Consulting',      sku: 'CONS-001',  type: 'SERVICE',  status: 'ACTIVE', price: 150.0,  inventoryQty: 0  },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      // IMPORTANT: input is orgId_sku, not sku_orgId
      where: { orgId_sku: { orgId: org.id, sku: p.sku } },
      update: {},
      create: { orgId: org.id, ...p },
    });
  }


  console.log('Seeded:', { org: org.slug, email });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});