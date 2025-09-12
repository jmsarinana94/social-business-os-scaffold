import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthModule } from '../../src/modules/auth/auth.module';

describe('Products (e2e)', () => {
  let app: INestApplication;

  const ORG = 'demo';
  const baseHeaders = { 'x-org': ORG };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, AuthModule], // 👈 add this
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products returns paginated list', async () => {
    const email = `p_${Date.now()}@ex.com`;
    const password = 'secret123';

    await request(app.getHttpServer())
      .post('/auth/signup')
      .set(baseHeaders)
      .send({ email, password, name: 'Tester' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(200);

    const token = login.body?.access_token || 'test-token';
    const headers = { ...baseHeaders, Authorization: `Bearer ${token}` };

    await request(app.getHttpServer())
      .get('/products?page=1&limit=5')
      .set(headers)
      .expect(200);
  });

  it('POST -> GET -> PUT (partial) -> DELETE', async () => {
    const email = `pp_${Date.now()}@ex.com`;
    const password = 'secret123';

    await request(app.getHttpServer())
      .post('/auth/signup')
      .set(baseHeaders)
      .send({ email, password, name: 'Tester' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(200);

    const token = login.body?.access_token || 'test-token';
    const headers = { ...baseHeaders, Authorization: `Bearer ${token}` };

    const createRes = await request(app.getHttpServer())
      .post('/products')
      .set(headers)
      .send({ title: 'Widget', type: 'physical', status: 'active', price: 12, description: 'Test' })
      .expect(201);

    const id = createRes.body.id ?? createRes.body.data?.id;

    await request(app.getHttpServer()).get(`/products/${id}`).set(headers).expect(200);
    await request(app.getHttpServer()).put(`/products/${id}`).set(headers).send({ price: 20 }).expect(200);
    await request(app.getHttpServer()).delete(`/products/${id}`).set(headers).expect(200);
  });
});