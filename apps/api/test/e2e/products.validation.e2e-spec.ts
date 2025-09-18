import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';
import { DecimalToNumberInterceptor } from '../../src/common/interceptors/decimal-to-number.interceptor';

describe('Products validation (e2e)', () => {
  let app: INestApplication;
  let token: string;

  const ORG = process.env.ORG || 'demo';
  const email = process.env.API_EMAIL || 'tester@example.com';
  const password = process.env.API_PASS || 'secret123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // mirror main.ts
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

    // Ensure org+user exist via API flows (no Prisma import)
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password, org: ORG })
      .expect(res => {
        // allow 201 (created) or 200 (if already exists + login returned)
        if (![200, 201].includes(res.status)) {
          throw new Error(`Unexpected signup status: ${res.status}`);
        }
      });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    token = login.body.access_token || login.body.token;
    if (!token) throw new Error('No JWT returned from /auth/login');
  });

  afterAll(async () => {
    await app.close();
  });

  it('400 when price is missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('x-org', ORG)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No Price', type: 'PHYSICAL', sku: `SKU-E2E-NOPRICE-${Date.now()}` })
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.message.join(' ')).toMatch(/price/i);
  });

  it('400 when extra properties are sent', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('x-org', ORG)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Extra',
        type: 'PHYSICAL',
        sku: `SKU-E2E-EXTRA-${Date.now()}`,
        price: 5,
        foo: 'bar',
      })
      .expect(400);

    expect(JSON.stringify(res.body.message)).toMatch(/should not exist/i);
  });

  it('201 and correct types for good payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('x-org', ORG)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Good',
        type: 'PHYSICAL',
        sku: `SKU-E2E-${Date.now()}`,
        price: 9.99,
        status: 'ACTIVE',
        inventoryQty: 0,
      })
      .expect(201);

    expect(typeof res.body.price).toBe('number');
    expect(typeof res.body.createdAt).toBe('string');
    expect(res.body.createdAt).toMatch(/^20\d{2}-\d{2}-\d{2}T/);
  });
});