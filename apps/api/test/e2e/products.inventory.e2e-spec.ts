import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';
import { DecimalToNumberInterceptor } from '../../src/common/interceptors/decimal-to-number.interceptor';

describe('Products inventory (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const ORG = process.env.ORG || 'demo';
  const email = process.env.API_EMAIL || 'tester@example.com';
  const password = process.env.API_PASS || 'secret123';
  const baseHeaders = { 'x-org': ORG };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, forbidNonWhitelisted: true, transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalInterceptors(new DecimalToNumberInterceptor());
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();

    await request(app.getHttpServer()).post('/auth/signup').send({ email, password, org: ORG });
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    token = login.body?.access_token || login.body?.token;
  });

  afterAll(async () => { await app.close(); });

  it('lists products and adjusts inventory +5, then rejects negative overshoot', async () => {
    const sku = `SKU-INV-${Date.now()}`;

    const created = await request(app.getHttpServer())
      .post('/products')
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({ title: 'Inv', type: 'PHYSICAL', status: 'ACTIVE', price: 1, sku, inventoryQty: 2 })
      .expect(201);

    const id = created.body.id;

    await request(app.getHttpServer())
      .post(`/products/${id}/inventory`)
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({ delta: 5 })
      .expect(200);

    const negDelta = -1000; // ensure it would go below zero
    await request(app.getHttpServer())
      .post(`/products/${id}/inventory`)
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({ delta: negDelta })
      .expect(400); // now enforced by service
  });
});