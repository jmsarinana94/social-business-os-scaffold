// apps/api/test/unit/products.service.spec.ts
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { ProductsService } from '../../src/modules/products/products.service';
import { PrismaService } from '../../src/prisma/prisma.service';

function makePrisma(): PrismaService {
  const now = () => new Date();

  const db: any = {
    product: {
      findMany: jest.fn(async (_args: Prisma.ProductFindManyArgs = {}) => [
        { id: 'p1', title: 'One', orgId: 'demo', createdAt: now(), updatedAt: now() },
        { id: 'p2', title: 'Two', orgId: 'demo', createdAt: now(), updatedAt: now() },
      ]),
      count: jest.fn(async (_args: Prisma.ProductCountArgs = {}) => 2),
      create: jest.fn(async (args: Prisma.ProductCreateArgs) => ({
        id: 'demo',
        orgId: 'demo',
        createdAt: now(),
        updatedAt: now(),
        ...(args.data as any),
      })),
      findFirst: jest.fn(async (args: Prisma.ProductFindFirstArgs) => {
        const where = (args.where ?? {}) as any;
        if (where.id === 'demo' && where.orgId === 'demo') {
          return { id: 'demo', title: 'demo', orgId: 'demo', createdAt: now(), updatedAt: now() };
        }
        return null;
      }),
      update: jest.fn(async (args: Prisma.ProductUpdateArgs) => ({
        id: (args.where as any).id ?? 'demo',
        orgId: 'demo',
        createdAt: now(),
        updatedAt: now(),
        ...(args.data as any),
      })),
      delete: jest.fn(async (args: Prisma.ProductDeleteArgs) => ({
        id: (args.where as any).id ?? 'demo',
        title: 'deleted',
        orgId: 'demo',
        createdAt: now(),
        updatedAt: now(),
      })),
    },
    organization: {
      upsert: jest.fn(async () => ({ id: 'demo' })),
    },
    $transaction: jest
      .fn()
      .mockImplementation(<P extends any[]>(ops: [...P]) => Promise.all(ops)),
  };

  return db as unknown as PrismaService;
}

describe('ProductsService (unit)', () => {
  it('lists products ...', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: makePrisma() }, // <-- provide PrismaService
      ],
    }).compile();

    const service = moduleRef.get(ProductsService);
    const res = await service.list('demo', { page: 1, limit: 10 });
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.meta.page).toBe(1);
    expect(res.data.length).toBeGreaterThanOrEqual(2);
  });

  it('creates a product and fetches it', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: makePrisma() }, // <-- provide PrismaService
      ],
    }).compile();

    const service = moduleRef.get(ProductsService);
    const created = await service.create('demo', { title: 'demo' } as any);
    expect(created.id).toBeTruthy();

    const got = await service.get('demo', created.id);
    expect(got.id).toBe(created.id);
  });
});