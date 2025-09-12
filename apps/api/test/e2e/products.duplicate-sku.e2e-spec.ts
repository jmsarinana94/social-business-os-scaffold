// apps/api/test/e2e/products.duplicate-sku.e2e-spec.ts
import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

describe('Products duplicate SKU (e2e)', () => {
  let app: INestApplication;
  const baseHeaders = { 'x-org': 'demo' };
  const email = 'dup-sku@demo.io';
  const password = 'pass123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post('/auth/signup')
      .set(baseHeaders)
      .send({ email, password, name: 'Dup Tester' });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('201 then 409 for same SKU in same org', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const token = login.body?.access_token;
    const headers = { ...baseHeaders, Authorization: `Bearer ${token}` };

    const payload = {
      sku: 'DUP-001',
      title: 'Widget',
      type: 'PHYSICAL',
      status: 'ACTIVE',
      price: '1.00',
    };

    await request(app.getHttpServer()).post('/products').set(headers).send(payload).expect(201);
    await request(app.getHttpServer()).post('/products').set(headers).send(payload).expect(409);
  });
});