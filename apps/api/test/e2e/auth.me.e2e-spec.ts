import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '@/app.module';

import { ensureOrg } from './utils/org';

describe('/auth/me (e2e)', () => {
  let app: INestApplication;
  const ORG_SLUG = 'demo-9bsfct';
  const baseHeaders = { 'X-Org': ORG_SLUG, 'Content-Type': 'application/json' };
  const email = `e2e-me-${Date.now()}@example.com`;
  const password = 'password123';
  let token = '';

  beforeAll(async () => {
    await ensureOrg({ slug: ORG_SLUG, name: 'demo' });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post('/auth/signup')
      .set(baseHeaders)
      .send({ email, password, org: ORG_SLUG })
      .expect(201);

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

  it('returns the current user when authorized', async () => {
    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .expect(200);

    expect(me.body).toHaveProperty('email', email);
  });
});