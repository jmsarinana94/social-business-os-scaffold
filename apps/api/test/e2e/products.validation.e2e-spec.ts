import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createE2EApp } from './support/e2e-app.factory';

describe('Products validation (e2e)', () => {
  let app: INestApplication;
  const email = `test+validation_${Date.now()}@example.com`;
  const password = 'password123';
  const ORG = 'demo-9bsfct'; // using your working org slug
  const baseHeaders = { 'X-Org': ORG, 'Content-Type': 'application/json' };
  let token = '';

  beforeAll(async () => {
    app = await createE2EApp();

    // signup (ok if it already exists)
    await request(app.getHttpServer())
      .post('/auth/signup')
      .set(baseHeaders)
      .send({ email, password, org: ORG })
      .expect(res => [200, 201, 409].includes(res.status));

    // login
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(200);

    token = login.body.access_token || login.body.token;
    if (!token) throw new Error('No JWT returned from /auth/login');
  });

  afterAll(async () => {
    await app.close();
  });

  it('400 when price is missing', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({
        title: 'Missing Price',
        sku: `SKU-${Date.now()}`,
        type: 'PHYSICAL',
        status: 'ACTIVE',
        inventoryQty: 1,
      })
      .expect(400);
  });

  it('400 when extra properties are sent', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({
        title: 'Extra Props',
        sku: `SKU-${Date.now()}`,
        price: 9.99,
        inventoryQty: 1,
        type: 'PHYSICAL',
        status: 'ACTIVE',
        // This should trigger forbidNonWhitelisted
        unknownField: 'nope',
      })
      .expect(400);
  });

  it('201 and correct types for good payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({
        title: 'Good Product',
        sku: `SKU-${Date.now()}`,
        price: 19.99,
        inventoryQty: 5,
        type: 'PHYSICAL',
        status: 'ACTIVE',
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      sku: expect.any(String),
      title: 'Good Product',
      type: 'PHYSICAL',
      status: 'ACTIVE',
      price: 19.99,
      inventoryQty: 5,
    });
  });
});