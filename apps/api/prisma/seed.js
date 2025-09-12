"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const org = await prisma.organization.upsert({
        where: { slug: 'acme' },
        update: {},
        create: { slug: 'acme', name: 'Acme Co.' },
    });
    await prisma.product.createMany({
        data: [
            {
                orgId: org.id,
                title: 'Cap',
                type: client_1.$Enums.ProductType.PHYSICAL,
                price: new client_1.PrismaClient.Prisma.Decimal('14.99'),
                sku: 'CAP-001',
                status: client_1.$Enums.ProductStatus.ACTIVE,
            },
            {
                orgId: org.id,
                title: 'Beanie',
                type: client_1.$Enums.ProductType.PHYSICAL,
                price: new client_1.PrismaClient.Prisma.Decimal('12.00'),
                sku: 'BEAN-001',
                status: client_1.$Enums.ProductStatus.ACTIVE,
            },
            {
                orgId: org.id,
                title: 'E-Book',
                type: client_1.$Enums.ProductType.DIGITAL,
                price: new client_1.PrismaClient.Prisma.Decimal('9.99'),
                sku: 'EBOOK-001',
                status: client_1.$Enums.ProductStatus.ACTIVE,
            },
        ],
        skipDuplicates: true,
    });
    console.log('Seeded.');
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map