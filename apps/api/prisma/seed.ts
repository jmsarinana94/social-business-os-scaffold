import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Org
  const org = await prisma.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { slug: 'acme', name: 'Acme Inc' },
  });

  // User (email unique across DB; membership implied by slug use in your flows)
  const email = 'a@b.com';
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: '$2a$10$K0wWIZX41o0hZcXxEKOI2egy02bZQJ2U7bMZ5bW8hZtS4QYJ6y0bS' }, // "pw"
  });

  // Product
  await prisma.product.upsert({
    where: { id: 'seed-acme-w1' },
    update: {},
    create: {
      id: 'seed-acme-w1',
      title: 'Widget',
      type: 'PHYSICAL',
      status: 'ACTIVE',
      price: 12.5,
      sku: 'W-1',
      organizationId: org.id,
    },
  });

  console.log('Seeded:', { org: org.slug, user: user.email });
}

main().finally(() => prisma.$disconnect());