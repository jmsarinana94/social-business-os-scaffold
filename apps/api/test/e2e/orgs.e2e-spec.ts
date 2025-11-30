// apps/api/test/e2e/orders.e2e-spec.ts

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from '../../src/modules/orders/orders.module';
import { PrismaModule } from '../../src/modules/prisma/prisma.module';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  const ORG = `orders-e2e-${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        // Load env the same way as the main app
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env', 'prisma/.env'],
        }),
        // This provides PrismaService
        PrismaModule,
        // This is the module under test
        OrdersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
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

  it('/orders (GET) requires X-Org', async () => {
    await request(app.getHttpServer()).get('/orders').expect(400);
  });

  it('/orders (GET) returns array when X-Org is present', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders')
      .set('X-Org', ORG)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});