// packages/db/prisma/seed-products.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding demo products...')

  const org = await prisma.organization.findUnique({ where: { slug: 'demo' } })
  if (!org) throw new Error('Organization "demo" not found. Run `pnpm run db:seed:demo` first.')

  const items = [
    { title: 'Sticker', description: 'Vinyl',       price: '2.50', sku: 'STK-001' },
    { title: 'Tee',     description: 'Soft cotton', price: '19.99', sku: 'TEE-001' },
    { title: 'Mug',     description: 'Ceramic',     price: '12.00', sku: 'MUG-001' },
  ]

  for (const it of items) {
    const p = await prisma.product.create({
      data: {
        orgId: org.id,
        title: it.title,
        description: it.description,
        price: it.price,
        type: 'PHYSICAL',
        status: 'ACTIVE',
        sku: it.sku,
      },
    })
    console.log('✅ Created:', p.title, p.id)
  }
  console.log('🌱 Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})