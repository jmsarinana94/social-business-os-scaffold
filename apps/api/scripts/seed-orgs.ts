 
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const orgs = [
    { slug: 'org-a-demo', name: 'org-a-demo' },
    { slug: 'org-b-demo', name: 'org-b-demo' },
  ];

  for (const o of orgs) {
    await prisma.organization.upsert({
      where: { slug: o.slug },
      create: { slug: o.slug, name: o.name },
      update: {},
    });
  }

  console.log('Seeded orgs:', orgs.map(o => o.slug).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });