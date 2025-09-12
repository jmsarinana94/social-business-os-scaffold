// apps/api/scripts/seed-org.ts
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  // Sanity check that Organization exists on the client
  if (!(prisma as any).organization) {
    throw new Error(
      'Prisma client not generated or Organization model missing.\n' +
      'Run: pnpm --filter ./apps/api prisma:generate'
    );
  }

  const slug = process.env.SEED_ORG_SLUG || 'acme';
  const name = process.env.SEED_ORG_NAME || 'Acme Inc';

  await prisma.organization.upsert({
    where: { slug },
    update: {},
    create: { slug, name },
  });

  console.log('Seeded organization:', slug);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});