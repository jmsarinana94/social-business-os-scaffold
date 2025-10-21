/* Run with: pnpm -F @repo/api exec ts-node --transpile-only prisma/seed-billing.ts */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slug = process.env.SEED_ORG_SLUG || 'demo';
  const plan = (process.env.SEED_PLAN || 'GROWTH') as any;

  const org = await prisma.organization.upsert({
    where: { slug },
    update: { subscriptionPlan: plan, subscriptionStatus: 'active' },
    create: {
      slug,
      name: 'Demo Org',
      subscriptionPlan: plan,
      subscriptionStatus: 'active',
    },
  });

  console.log('Seeded org with plan:', org.slug, org.subscriptionPlan);
}

main().finally(() => prisma.$disconnect());