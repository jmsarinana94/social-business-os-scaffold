/* ---------------------------------------
 * apps/api/prisma/seed.cjs
 * ---------------------------------------
 * Runs as Prisma's official seed entrypoint.
 * Compatible with "type": "module" projects.
 *
 * Usage:
 *   pnpm -C apps/api run db:seed
 *   or
 *   pnpm -C apps/api run db:reset:seed:local
 * --------------------------------------*/

const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // -----------------------------
  // Defaults (from .env or fallback)
  // -----------------------------
  const EMAIL = process.env.SEED_EMAIL || "tester@example.com";
  const PASS = process.env.SEED_PASSWORD || "password123";
  const ORG_SLUG = process.env.SEED_ORG_SLUG || "demo-9bsfct";
  const ORG_NAME = process.env.SEED_ORG_NAME || "Demo Org";

  // -----------------------------
  // 1) Seed default orgs for E2E
  // -----------------------------
  const orgSlugs = ["demo", "test-org", "acme", ORG_SLUG];
  const orgs = [];

  for (const slug of orgSlugs) {
    const org = await prisma.organization.upsert({
      where: { slug },
      update: { name: slug === "demo" ? "Demo Org" : slug.replace(/-/g, " ") },
      create: {
        slug,
        name: slug === "demo" ? "Demo Org" : slug.replace(/-/g, " "),
      },
    });
    orgs.push(org);
  }

  // -----------------------------
  // 2) Ensure demo user
  // -----------------------------
  const passwordHash = await bcrypt.hash(PASS, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash },
    create: { email: EMAIL, passwordHash },
    select: { id: true, email: true },
  });

  // -----------------------------
  // 3) Ensure membership
  // -----------------------------
  const demoOrg =
    orgs.find((o) => o.slug === ORG_SLUG) ||
    orgs.find((o) => o.slug === "demo");

  if (demoOrg) {
    const member = await prisma.orgMember.findFirst({
      where: { userId: user.id, organizationId: demoOrg.id },
    });
    if (!member) {
      await prisma.orgMember.create({
        data: { userId: user.id, organizationId: demoOrg.id, role: "ADMIN" },
      });
    }
  }

  // -----------------------------
  // 4) Ensure demo product
  // -----------------------------
  const SEED_SKU = "SEED-SKU-001";
  const existing = await prisma.product.findFirst({
    where: { sku: SEED_SKU, organizationId: demoOrg.id },
  });

  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        title: "Seed Hoodie",
        price: new Prisma.Decimal(59.99),
        status: "ACTIVE",
        inventoryQty: 10,
        type: "PHYSICAL",
      },
    });
  } else {
    await prisma.product.create({
      data: {
        sku: SEED_SKU,
        title: "Seed Hoodie",
        description: "A sample seeded product",
        type: "PHYSICAL",
        status: "ACTIVE",
        price: new Prisma.Decimal(59.99),
        inventoryQty: 10,
        organizationId: demoOrg.id,
      },
    });
  }

  console.log("✅ Seed complete:");
  console.table({
    user: user.email,
    orgs: orgs.map((o) => o.slug).join(", "),
    product: SEED_SKU,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
