/* apps/api/prisma/seed.cjs */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgSlugs = [
    // Add any slugs your tests use. "demo" is common across the e2e helpers.
    'demo',
    // Add backups just in case different tests use alternates:
    'test-org',
    'acme'
  ];

  for (const slug of orgSlugs) {
    await prisma.organization.upsert({
      where: { slug },
      update: {},
      create: { slug, name: slug === 'demo' ? 'Demo' : slug.replace(/-/g, ' ') },
    });
  }

  console.log('Seeded orgs:', orgSlugs.join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });