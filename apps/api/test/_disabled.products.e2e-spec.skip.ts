// apps/api/test/products.e2e-spec.ts
import 'reflect-metadata';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';

const prisma = new PrismaClient();
const ORG_SLUG = process.env.TEST_ORG ?? 'demo';

describe('Products (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // reset DB
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Product" RESTART IDENTITY CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Organization" RESTART IDENTITY CASCADE;');

    // seed org
    await prisma.organization.create({
      data: { slug: ORG_SLUG, name: ORG_SLUG.toUpperCase() },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('health', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body?.ok).toBe(true);
  });

  it('create/list/get/update/delete product', async () => {
    const agent = request(app.getHttpServer());
    const headers = { 'x-org': ORG_SLUG, 'content-type': 'application/json' };

    // create
    const createRes = await agent
      .post('/products')
      .set(headers)
      .send({ title: 'Widget', type: 'physical', status: 'active', price: 12, description: 'Test' })
      .expect(201);

    const id = createRes.body.id ?? createRes.body.data?.id;
    expect(id).toBeTruthy();

    // get
    const getRes = await agent.get(`/products/${id}`).set({ 'x-org': ORG_SLUG }).expect(200);
    expect(getRes.body.title).toEqual('Widget');

    // update
    const updRes = await agent
      .put(`/products/${id}`)
      .set(headers)
      .send({ title: 'Widget (updated)', price: 19 })
      .expect(200);
    expect(updRes.body.title).toEqual('Widget (updated)');

    // list
    const listRes = await agent.get('/products?page=1&limit=5').set({ 'x-org': ORG_SLUG }).expect(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.meta?.page).toBe(1);

    // delete
    await agent.delete(`/products/${id}`).set({ 'x-org': ORG_SLUG }).expect(200);
    await agent.get(`/products/${id}`).set({ 'x-org': ORG_SLUG }).expect(404);
  });

  it('rejects missing x-org', async () => {
    await request(app.getHttpServer()).get('/products').expect(400);
  });
});