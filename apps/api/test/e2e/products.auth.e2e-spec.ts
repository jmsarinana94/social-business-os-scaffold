import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';
import { DecimalToNumberInterceptor } from '../../src/common/interceptors/decimal-to-number.interceptor';

describe('Products Auth (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const ORG = process.env.ORG || 'demo';
  const email = process.env.API_EMAIL || 'tester@example.com';
  const password = process.env.API_PASS || 'secret123';
  const headers = { 'x-org': ORG };

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
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);
    token = login.body?.access_token || login.body?.token;
  });

  afterAll(async () => { await app.close(); });

  it('signup/login then CRUD with Bearer token', async () => {
    const sku = `SKU-AUTH-${Date.now()}`;

    const created = await request(app.getHttpServer())
      .post('/products')
      .set({ ...headers, Authorization: `Bearer ${token}` })
      .send({ title: 'Thing', type: 'PHYSICAL', status: 'ACTIVE', price: 9.99, sku })
      .expect(201);

    const id = created.body.id;

    await request(app.getHttpServer())
      .delete(`/products/${id}`)
      .set({ ...headers, Authorization: `Bearer ${token}` })
      .expect(200);
  });
});