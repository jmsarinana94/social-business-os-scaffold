 
import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const env = (k: string, d?: string) => process.env[k] ?? d;

async function main() {
  const ORG_SLUG = env('ORG', env('SEED_ORG_SLUG', 'demo'))!;
  const ORG_NAME = env('SEED_ORG_NAME', 'Demo Org')!;
  const EMAIL    = env('API_EMAIL', env('SEED_EMAIL', 'tester@example.com'))!;
  const PASS     = env('API_PASS',  env('SEED_PASSWORD', 'secret123'))!;

  console.log('🔧 Seeding with:', { ORG_SLUG, ORG_NAME, EMAIL });

  // org by slug (don’t assume id="demo")
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: { slug: ORG_SLUG, name: ORG_NAME },
  });
  console.log(`✓ Org slug=${org.slug} id=${org.id}`);

  // user
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {},
    create: { email: EMAIL, name: 'Seed User', passwordHash: await bcrypt.hash(PASS, 10) },
  });
  console.log(`✓ User ${EMAIL}`);

  // membership/orgUser (supports either table/enum naming)
  await (prisma as any).membership?.upsert?.({
    where: { orgId_userId: { orgId: org.id, userId: user.id } },
    update: { role: 'OWNER' },
    create: { orgId: org.id, userId: user.id, role: 'OWNER' },
  }).catch(async () => {
    await (prisma as any).orgUser?.upsert?.({
      where: { orgId_userId: { orgId: org.id, userId: user.id } },
      update: { role: 'admin' },
      create: { orgId: org.id, userId: user.id, role: 'admin' },
    });
  });
  console.log('✓ Membership');

  // product with expected enum casing + required price
  const productData: Prisma.ProductCreateInput = {
    org: { connect: { id: org.id } },
    sku: 'SKU-SEED',
    title: 'Seed Widget',
    type: 'PHYSICAL' as any,
    status: 'ACTIVE' as any,
    price: new Prisma.Decimal(25),
    inventoryQty: 100,
    description: 'Seeded product',
  };

  await (prisma as any).product.upsert({
    where: { sku_orgId: { sku: productData.sku as string, orgId: org.id } },
    update: {},
    create: productData as any,
  });

  console.log('✓ Product SKU-SEED');
  console.log('✅ Seed complete');
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});