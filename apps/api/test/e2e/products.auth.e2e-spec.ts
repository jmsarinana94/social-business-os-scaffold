import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';

describe('Products Auth (e2e)', () => {
  let app: INestApplication;

  const ORG = 'demo';
  const baseHeaders = { 'x-org': ORG };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('signup/login then CRUD with Bearer token', async () => {
    const server = app.getHttpServer();

    const stamp = Date.now();
    const email = `tester+${stamp}@example.com`;
    const password = 'password';

    // Register (your API uses /auth/register)
    await request(server)
      .post('/auth/register')
      .set(baseHeaders)
      .send({ email, password, name: 'Test User' })
      .expect(201);

    // Login (your API uses /auth/login)
    const login = await request(server)
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(201);

    const token: string = login.body?.access_token ?? login.body?.token ?? '';
    expect(token).toBeTruthy();

    const authHeaders = {
      ...baseHeaders,
      Authorization: `Bearer ${token}`,
    };

    // Create -> Get -> Update -> Delete
    const sku = `SKU-${Math.floor(Math.random() * 100000)}`;
    const created = await request(server)
      .post('/products')
      .set(authHeaders)
      .send({
        title: 'AuthProd',
        sku,
        type: 'physical',
        status: 'active',
        price: 11,
        inventoryQty: 2,
      })
      .expect(201);

    const createdObj = created.body?.data ?? created.body;
    const id: string = createdObj.id;
    expect(id).toBeTruthy();

    await request(server)
      .get(`/products/${id}`)
      .set(authHeaders)
      .expect(200);

    await request(server)
      .put(`/products/${id}`)
      .set(authHeaders)
      .send({ title: 'AuthProd (updated)', price: 14 })
      .expect(200);

    await request(server)
      .delete(`/products/${id}`)
      .set(authHeaders)
      .expect(200);

    await request(server)
      .get(`/products/${id}`)
      .set(authHeaders)
      .expect(404);
  });
});