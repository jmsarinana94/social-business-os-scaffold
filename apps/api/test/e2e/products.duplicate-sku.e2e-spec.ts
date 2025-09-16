// apps/api/test/e2e/products.duplicate-sku.e2e-spec.ts
import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

describe('Products duplicate SKU (e2e)', () => {
  let app: INestApplication;
  const ORG = process.env.ORG || 'demo';
  const baseHeaders = { 'x-org': ORG, 'content-type': 'application/json' };

  // Use run-unique email/SKU so previous runs don’t collide
  const email = `dup-sku+${Date.now()}@demo.io`;
  const password = 'pass123';
  const SKU = `DUP-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Create user (idempotent: 201 or 409 OK)
    await request(app.getHttpServer())
      .post('/auth/signup')
      .set(baseHeaders)
      .send({ email, password, name: 'Dup Tester' })
      .ok(res => res.status === 201 || res.status === 409);

    // Ensure login for this user works (200)
    await request(app.getHttpServer())
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('201 then 409 for same SKU in same org', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(200);

    const token = login.body?.access_token;
    expect(token).toBeTruthy();

    const headers = { ...baseHeaders, Authorization: `Bearer ${token}` };

    const payload = {
      sku: SKU,            // unique for this run
      title: 'Widget',
      type: 'PHYSICAL',
      status: 'ACTIVE',
      price: '1.00',
    };

    // First create: accept 201 (or 200 if your controller returns OK)
    await request(app.getHttpServer())
      .post('/products')
      .set(headers)
      .send(payload)
      .ok(res => res.status === 201 || res.status === 200);

    // Second create with same SKU must be 409
    await request(app.getHttpServer())
      .post('/products')
      .set(headers)
      .send(payload)
      .expect(409);
  });
});