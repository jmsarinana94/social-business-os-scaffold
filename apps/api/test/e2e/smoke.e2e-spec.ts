// /apps/api/test/e2e/smoke.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '@/app.module';

import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';
import { DecimalToNumberInterceptor } from '../../src/common/interceptors/decimal-to-number.interceptor';

describe('API smoke (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const ORG = process.env.ORG || 'demo';
  const email = process.env.API_EMAIL || 'tester@example.com';
  const password = process.env.API_PASS || 'secret123';
  const headers = { 'x-org': ORG };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new DecimalToNumberInterceptor());
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();

    // 1) Signup (ignore if already exists)
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password, org: ORG })
      .ok(() => true); // don’t fail if already created

    // 2) Login — accept any 2xx (some APIs use 200 for login)
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .ok((res) => res.status >= 200 && res.status < 300)
      .expect('Content-Type', /json/);

    token = login.body?.access_token ?? login.body?.token;
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  afterAll(async () => {
    await app.close();
  });

  it('auth + products CRUD', async () => {
    const sku = `SKU-SMOKE-${Date.now()}`;

    // Create product
    const created = await request(app.getHttpServer())
      .post('/products')
      .set({ ...headers, Authorization: `Bearer ${token}` })
      .send({
        title: 'Widget',
        type: 'PHYSICAL',
        status: 'ACTIVE',
        price: 12.34,
        sku,
        description: 'Smoke',
      })
      .expect(201);
    const id = created.body.id;
    expect(id).toBeTruthy();

    // Read product
    await request(app.getHttpServer()).get(`/products/${id}`).set(headers).expect(200);

    // Delete product
    await request(app.getHttpServer())
      .delete(`/products/${id}`)
      .set({ ...headers, Authorization: `Bearer ${token}` })
      .expect(200);
  });
});