// apps/api/scripts/seed-all.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'reflect-metadata';

const prisma = new PrismaClient();

async function main() {
  const orgSlug = process.env.SEED_ORG_SLUG || 'demo';
  const orgName = process.env.SEED_ORG_NAME || 'Demo Org';

  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: { slug: orgSlug, name: orgName },
  });

  const email = process.env.API_EMAIL || 'admin@example.com';
  const pass = process.env.API_PASS || 'password123';
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Admin', passwordHash: await bcrypt.hash(pass, 10) },
  });

  await prisma.orgUser.upsert({
    where: { orgId_userId: { orgId: org.id, userId: user.id } },
    update: { role: 'admin' },
    create: { orgId: org.id, userId: user.id, role: 'admin' },
  });

  console.log(`Seeded org=${org.slug}, user=${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());