import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthModule } from '../../src/modules/auth/auth.module';

describe('Products Auth (e2e)', () => {
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

  it('signup/login then CRUD with Bearer token', async () => {
    const server = app.getHttpServer();

    const email = `auth_${Date.now()}@example.com`;
    const password = 'secret123';

    await request(server)
      .post('/auth/signup')
      .set(baseHeaders)
      .send({ email, password, name: 'Test User' })
      .expect(201);

    const login = await request(server)
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(200);

    const token = login.body?.access_token || 'test-token';
    const headers = { ...baseHeaders, Authorization: `Bearer ${token}` };

    const created = await request(server)
      .post('/products')
      .set(headers)
      .send({ title: 'Thing', type: 'physical', status: 'active', price: 9.99 })
      .expect(201);

    const id = created.body.id ?? created.body.data?.id;

    await request(server).get(`/products/${id}`).set(headers).expect(200);
    await request(server).put(`/products/${id}`).set(headers).send({ description: 'updated' }).expect(200);
    await request(server).delete(`/products/${id}`).set(headers).expect(200);
  });
});