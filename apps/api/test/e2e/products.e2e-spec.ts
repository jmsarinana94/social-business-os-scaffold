import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let authHeaders: Record<string, string>;

  const ORG = 'demo';
  const baseHeaders = { 'x-org': ORG };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Sign up + login to obtain token
    const stamp = Date.now();
    const email = `tester+${stamp}@example.com`;
    const password = 'password';

    await request(app.getHttpServer())
      .post('/auth/register')
      .set(baseHeaders)
      .send({ email, password, name: 'Tester' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(201);

    const token: string = login.body?.access_token ?? login.body?.token ?? '';
    authHeaders = { ...baseHeaders, Authorization: `Bearer ${token}` };
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products returns paginated list', async () => {
    const res = await request(app.getHttpServer())
      .get('/products?page=1&limit=5')
      .set(authHeaders)
      .expect(200);

    const body = res.body?.data ?? res.body;
    const list = body.data ?? body;
    expect(Array.isArray(list)).toBe(true);
  });

  it('POST -> GET -> PUT (partial) -> DELETE', async () => {
    const server = app.getHttpServer();

    // Create
    const sku = `SKU-${Math.floor(Math.random() * 1e6)}`;
    const created = await request(server)
      .post('/products')
      .set(authHeaders)
      .send({
        title: 'Prod A',
        sku,
        type: 'physical',
        status: 'active',
        price: 12,
        inventoryQty: 3,
        description: null,
      })
      .expect(201);

    const createdObj = created.body?.data ?? created.body;
    const id: string = createdObj.id;
    expect(id).toBeTruthy();

    // Get
    const got = await request(server)
      .get(`/products/${id}`)
      .set(authHeaders)
      .expect(200);
    const gotObj = got.body?.data ?? got.body;
    expect(gotObj.id).toBe(id);

    // Partial update
    await request(server)
      .put(`/products/${id}`)
      .set(authHeaders)
      .send({ price: 17, inventoryQty: 7 })
      .expect(200);

    // Delete
    await request(server)
      .delete(`/products/${id}`)
      .set(authHeaders)
      .expect(200);

    // Confirm 404
    await request(server)
      .get(`/products/${id}`)
      .set(authHeaders)
      .expect(404);
  });
});