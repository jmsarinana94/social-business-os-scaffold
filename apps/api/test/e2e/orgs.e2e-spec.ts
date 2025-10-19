import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bootstrapE2E } from '../helpers/bootstrap'; // use your existing helper if you have one

describe('Orgs (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapE2E();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an org and reads it back', async () => {
    const slug = `org-${Math.random().toString(36).slice(2, 8)}`;

    const created = await request(app.getHttpServer())
      .post('/orgs')
      .send({ slug, name: 'Test Org' })
      .expect(201);

    expect(created.body.slug).toBe(slug);

    const me = await request(app.getHttpServer())
      .get('/orgs/me')
      .set({ 'X-Org': slug })
      .expect(200);

    expect(me.body.slug).toBe(slug);
  });

  it('rejects missing X-Org where required', async () => {
    await request(app.getHttpServer()).get('/products').expect(400);
  });
});