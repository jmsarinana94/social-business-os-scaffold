import { Test } from '@nestjs/testing';

import { PrismaService } from '../../src/infra/prisma/prisma.service';
import { ProductsService } from '../../src/modules/products/products.service';

function makePrismaMock(): PrismaService {
  // in-memory db
  const org = { id: 'org_1', slug: 'demo', name: 'Demo Org', createdAt: new Date(), updatedAt: new Date() };
  const products: any[] = [
    { id: 'p1', orgId: org.id, title: 'Widget A', type: 'physical', status: 'active', price: 10, description: null, sku: 'SKU-A', createdAt: new Date(), updatedAt: new Date() },
    { id: 'p2', orgId: org.id, title: 'Widget B', type: 'physical', status: 'active', price: 15, description: null, sku: 'SKU-B', createdAt: new Date(), updatedAt: new Date() },
  ];

  const organization = {
    findUnique: jest.fn(async ({ where }: any) => (where.slug === org.slug ? org : null)),
  };

  const product = {
    findMany: jest.fn(async ({ where, skip = 0, take = 10 }: any) => {
      const list = products.filter((p) => p.orgId === where.orgId);
      return list.slice(skip, skip + take);
    }),
    count: jest.fn(async ({ where }: any) => products.filter((p) => p.orgId === where.orgId).length),
    findFirst: jest.fn(async ({ where }: any) => products.find((p) => p.id === where.id && p.orgId === where.orgId) ?? null),
    create: jest.fn(async ({ data }: any) => {
      const item = {
        id: `p_${products.length + 1}`,
        orgId: data.organization.connect.id,
        title: data.title,
        type: data.type,
        status: data.status,
        price: data.price,
        description: data.description ?? null,
        sku: data.sku ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      products.push(item);
      return item;
    }),
    update: jest.fn(async ({ where, data }: any) => {
      const idx = products.findIndex((p) => p.id === where.id);
      if (idx < 0) throw new Error('not found');
      products[idx] = { ...products[idx], ...data, updatedAt: new Date() };
      return products[idx];
    }),
    delete: jest.fn(async ({ where }: any) => {
      const idx = products.findIndex((p) => p.id === where.id);
      if (idx >= 0) products.splice(idx, 1);
      return true;
    }),
  };

  // minimal $transaction that runs all promises
  const $transaction = async (ops: any[]) => Promise.all(ops);

  return {
    organization,
    product,
    $transaction,
  } as unknown as PrismaService;
}

describe('ProductsService (unit)', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: makePrismaMock() },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  it('lists products ...', async () => {
    const res = await service.list('demo', { page: 1, limit: 10 });
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.meta.page).toBe(1);
    expect(res.data.length).toBeGreaterThanOrEqual(2);
  });

  it('creates a product and fetches it', async () => {
    const created = await service.create(
      { title: 'New Thing', type: 'physical', status: 'active', price: 12.5, description: 'test' },
      'demo',
    );
    expect(created.id).toBeTruthy();

    const fetched = await service.get('demo', created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe('New Thing');
  });
});