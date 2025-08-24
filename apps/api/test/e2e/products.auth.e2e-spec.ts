import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Products Auth (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    // Make sure JwtModule has a secret during tests
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('signup/login then CRUD with Bearer token', async () => {
    const email = `user${Date.now()}@ex.com`;
    const password = 'Passw0rd!';

    // sign up
    await request(server)
      .post('/auth/signup')
      .send({ email, password, name: 'Test User' })
      .expect(201);

    // login
    const login = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const token =
      login.body?.access_token ?? login.body?.data?.access_token;

    // create
    const created = await request(server)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .set('x-org', 'demo')
      .send({
        title: 'Auth Product',
        type: 'physical',
        status: 'active',
        description: null,
      })
      .expect(201);

    const createdObj = created.body?.data ?? created.body;
    const id = createdObj.id;

    // get one
    await request(server)
      .get(`/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-org', 'demo')
      .expect(200);

    // update
    await request(server)
      .put(`/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-org', 'demo')
      .send({ title: 'Updated' })
      .expect(200);

    // delete
    await request(server)
      .delete(`/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-org', 'demo')
      .expect(200);
  });
});