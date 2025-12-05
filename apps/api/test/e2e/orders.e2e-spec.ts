// apps/api/test/e2e/orders.e2e-spec.ts

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { bootstrapE2E } from '../helpers/bootstrap';

describe('Orders (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Reuse the same helper the other e2e tests use
    app = await bootstrapE2E();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/orders/health (GET) returns 200 + ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders/health')
      .expect(200);

    expect(res.body).toEqual({ ok: true, scope: 'orders' });
  });
});