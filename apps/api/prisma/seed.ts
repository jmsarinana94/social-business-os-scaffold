// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const EMAIL = process.env.EMAIL || 'tester@example.com';
  const API_PASS = process.env.PASS || 'Passw0rd!demo';

  // Org inputs (use ID if given; fall back to slug; create sensible defaults)
  const ORG_ID = process.env.ORG_ID || undefined;                 // e.g., 'cmg7h3o1j0000siron00aamg6'
  const ORG_SLUG = (process.env.ORG_SLUG && process.env.ORG_SLUG.trim().length > 0)
    ? process.env.ORG_SLUG!.trim()
    : 'demo-org';
  const ORG_NAME = 'Demo Org';

  // 1) Upsert Organization
  //    Prefer id for the unique "where" if provided; otherwise use slug.
  const org = await (async () => {
    if (ORG_ID) {
      return prisma.organization.upsert({
        where: { id: ORG_ID },
        update: { slug: ORG_SLUG, name: ORG_NAME },
        create: { id: ORG_ID, slug: ORG_SLUG, name: ORG_NAME },
      });
    } else {
      // assumes slug is unique in your schema
      return prisma.organization.upsert({
        where: { slug: ORG_SLUG },
        update: { name: ORG_NAME },
        create: { slug: ORG_SLUG, name: ORG_NAME },
      });
    }
  })();

  // 2) Upsert User (with a bcrypt hash) and CONNECT to org
  const passwordHash = await bcrypt.hash(API_PASS, 10);

  await prisma.user.upsert({
    where: { email: EMAIL },
    update: { password: passwordHash, org: { connect: { id: org.id } } },
    create: {
      email: EMAIL,
      password: passwordHash,
      org: { connect: { id: org.id } }, // <- the missing bit
    },
  });

  // (Optional) seed any baseline products here if you want
  // await prisma.product.createMany({ data: [...] });

  console.log(`Seeded org=${org.id} (${org.slug}) and user=${EMAIL}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });