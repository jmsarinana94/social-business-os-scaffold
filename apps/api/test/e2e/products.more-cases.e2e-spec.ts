// apps/api/test/e2e/products.more-cases.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const ORG_HEADER = 'x-org-id';
const ORG_A = process.env.ORG_ID || 'cmg7h3o1j0000siron00aamg6';
const ORG_B = process.env.ORG_ID_2 || 'org-b-demo';
const makeSku = (pfx: string) => `SKU-${pfx}-${Date.now().toString(36).slice(-4)}`;

describe('Products more cases (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows the same SKU in a different org (ORG_A vs ORG_B)', async () => {
    const sku = makeSku('CROSS');
    const a = await request(server).post('/products').set(ORG_HEADER, ORG_A).send({ sku }).expect(201);
    const b = await request(server).post('/products').set(ORG_HEADER, ORG_B).send({ sku }).expect(201);
    expect(a.body?.sku).toBe(sku);
    expect(b.body?.sku).toBe(sku);
  });

  it('update: changing SKU to an existing SKU in same org -> 409', async () => {
    const sku1 = makeSku('U1');
    const sku2 = makeSku('U2');
    const p1 = await request(server).post('/products').set(ORG_HEADER, ORG_A).send({ sku: sku1 }).expect(201);
    await request(server).post('/products').set(ORG_HEADER, ORG_A).send({ sku: sku2 }).expect(201);
    await request(server).patch(`/products/${p1.body.id}`).set(ORG_HEADER, ORG_A).send({ sku: sku2 }).expect(409);
  });

  it('validation: bad sku format -> 400', async () => {
    await request(server).post('/products').set(ORG_HEADER, ORG_A).send({ sku: 'bad sku' }).expect(400);
  });

  it('org scoping: list returns only products from its org', async () => {
    const skuA = makeSku('LA');
    const skuB = makeSku('LB');
    await request(server).post('/products').set(ORG_HEADER, ORG_A).send({ sku: skuA }).expect(201);
    await request(server).post('/products').set(ORG_HEADER, ORG_B).send({ sku: skuB }).expect(201);
    const listA = await request(server).get('/products').set(ORG_HEADER, ORG_A).expect(200);
    const listB = await request(server).get('/products').set(ORG_HEADER, ORG_B).expect(200);
    const skusA: string[] = listA.body.map((p: any) => p.sku);
    const skusB: string[] = listB.body.map((p: any) => p.sku);
    expect(skusA).toContain(skuA);
    expect(skusA).not.toContain(skuB);
    expect(skusB).toContain(skuB);
    expect(skusB).not.toContain(skuA);
  });
});