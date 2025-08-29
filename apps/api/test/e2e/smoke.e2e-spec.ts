import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';

describe('API smoke (e2e)', () => {
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

  it('health', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set(baseHeaders)
      .expect(200);

    // Supports either { ok: true, ... } or wrapped shape { ok: true, data: ... }
    expect(res.body.ok).toBe(true);
  });

  it('auth + products CRUD', async () => {
    const server = app.getHttpServer();

    // unique email per run
    const stamp = Date.now();
    const email = `tester+${stamp}@example.com`;
    const password = 'password';

    // Register
    await request(server)
      .post('/auth/register')
      .set(baseHeaders)
      .send({ email, password, name: 'Tester' })
      .expect(201);

    // Login
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

    // Create product
    const sku = `SKU-${Math.floor(Math.random() * 100000)}`;
    const createRes = await request(server)
      .post('/products')
      .set(authHeaders)
      .send({
        title: 'Widget',
        sku,
        type: 'physical',
        status: 'active',
        price: 10,
        inventoryQty: 5,
        description: 'Smoke',
      })
      .expect(201);

    const created = createRes.body?.data ?? createRes.body;
    const id: string = created.id;
    expect(id).toBeTruthy();

    // Get product
    const getRes = await request(server)
      .get(`/products/${id}`)
      .set(authHeaders)
      .expect(200);

    const got = getRes.body?.data ?? getRes.body;
    expect(got.id).toBe(id);
    expect(got.title).toBe('Widget');

    // Update product
    await request(server)
      .put(`/products/${id}`)
      .set(authHeaders)
      .send({ title: 'Widget (updated)', price: 15, inventoryQty: 20 })
      .expect(200);

    // List products (paginated)
    const listRes = await request(server)
      .get('/products?page=1&limit=10')
      .set(authHeaders)
      .expect(200);

    const body = listRes.body?.data ?? listRes.body;
    const list = body.data ?? body; // supports wrapped/unwrapped
    expect(Array.isArray(list)).toBe(true);

    // Delete product
    await request(server)
      .delete(`/products/${id}`)
      .set(authHeaders)
      .expect(200);

    // Confirm 404 after delete
    await request(server)
      .get(`/products/${id}`)
      .set(authHeaders)
      .expect(404);
  });
});