import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';
import { DecimalToNumberInterceptor } from '../../src/common/interceptors/decimal-to-number.interceptor';

describe('Auth /auth/me (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => { await app.close(); });

  it('returns the current user when authorized', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email, password })
      .expect(200);

    const token = login.body?.access_token || login.body?.token;

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .expect(200);

    expect(me.body.email).toBe(email);
  });
});