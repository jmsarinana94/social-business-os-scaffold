// apps/api/test/e2e/products.auth.e2e-spec.ts
import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

const ORG = process.env.E2E_ORG_SLUG || 'demo-9bsfct';
const baseHeaders = { 'X-Org': ORG, 'Content-Type': 'application/json' };

describe('Products Auth (e2e)', () => {
  let app: INestApplication;
  let token: string;

  const email = `auth-e2e-${Date.now()}@example.com`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // ensure account exists
    await request(app.getHttpServer())
      .post('/auth/signup')
      .set(baseHeaders)
      .send({ email, password, org: ORG });

    // login to get JWT
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(200);

    token = login.body?.access_token || login.body?.token;
    if (!token) throw new Error('No JWT returned from /auth/login');
  });

  afterAll(async () => {
    await app.close();
  });

  it('signup/login then CRUD with Bearer token', async () => {
    // CREATE
    const create = await request(app.getHttpServer())
      .post('/products')
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({
        title: 'Auth Product v1',
        sku: `AUTH-${Date.now()}`,
        price: 49.99,
        inventoryQty: 5,
        type: 'PHYSICAL',
        status: 'ACTIVE',
      })
      .expect(201);

    const created = create.body;
    expect(created?.id).toBeDefined();

    // GET
    const got = await request(app.getHttpServer())
      .get(`/products/${created.id}`)
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .expect(200);

    expect(got.body?.id).toBe(created.id);

    // UPDATE — use PUT (your API exposes PUT; PATCH would 404)
    await request(app.getHttpServer())
      .put(`/products/${created.id}`)
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({ title: 'Auth Product v2' })
      .expect(200);

    // INVENTORY — POST /products/:id/inventory { delta }
    const inv = await request(app.getHttpServer())
      .post(`/products/${created.id}/inventory`)
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({ delta: 7 })
      .expect(200);

    expect(inv.body?.inventoryQty).toBeDefined();

    // DELETE
    await request(app.getHttpServer())
      .delete(`/products/${created.id}`)
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .expect(200);
  });
});