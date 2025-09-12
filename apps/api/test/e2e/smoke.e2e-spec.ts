import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthModule } from '../../src/modules/auth/auth.module';

describe('API smoke (e2e)', () => {
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

  it('auth + products CRUD', async () => {
    const server = app.getHttpServer();

    const email = `test_${Date.now()}@example.com`;
    const password = 'secret123';

    await request(server)
      .post('/auth/signup')
      .set(baseHeaders)
      .send({ email, password, name: 'Tester' })
      .expect(201);

    const login = await request(server)
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(200);

    const token = login.body?.access_token || login.body?.token || 'test-token';

    const headers = { ...baseHeaders, Authorization: `Bearer ${token}` };

    await request(server).get('/health').expect(200);

    const created = await request(server)
      .post('/products')
      .set(headers)
      .send({ title: 'Widget', type: 'physical', status: 'active', price: 12.34, description: 'Smoke' })
      .expect(201);

    const id = created.body.id ?? created.body.data?.id;

    await request(server).get('/products').set(headers).expect(200);

    await request(server).get(`/products/${id}`).set(headers).expect(200);

    await request(server).put(`/products/${id}`).set(headers).send({ price: 15.5 }).expect(200);

    await request(server).delete(`/products/${id}`).set(headers).expect(200);
  });
});