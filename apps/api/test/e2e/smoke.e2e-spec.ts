import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

describe('API smoke (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const ORG = process.env.ORG || 'demo';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Ensure org exists
    await prisma.organization.upsert({
      where: { id: ORG },
      update: {},
      create: { id: ORG, name: ORG, slug: ORG },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('health', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.ok).toBe(true);
  });

  it('auth + products CRUD', async () => {
    const email = `e2e+${Date.now()}@example.com`;
    const password = 'password';

    // Register
    await request(app.getHttpServer())
      .post('/auth/register')
      .set('x-org', ORG)
      .send({ email, password, name: 'Tester' })
      .expect(201);

    // Login
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-org', ORG)
      .send({ email, password })
      .expect(201);
    expect(login.body.access_token).toBeTruthy();
    const token = login.body.access_token as string;

    // Create product
    const create = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .set('x-org', ORG)
      .send({
        title: 'Widget',
        sku: `SKU-${Math.floor(Math.random() * 100000)}`,
        type: 'physical',
        status: 'active',
        price: 10,
        inventoryQty: 5,
        description: 'e2e',
      })
      .expect(201);

    const id = create.body.data.id as string;
    expect(id).toBeTruthy();

    // Get
    const get = await request(app.getHttpServer())
      .get(`/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-org', ORG)
      .expect(200);
    expect(get.body.data.id).toBe(id);

    // Update
    await request(app.getHttpServer())
      .put(`/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-org', ORG)
      .send({ price: 12, inventoryQty: 9, title: 'Widget (updated)' })
      .expect(200);

    // List
    const list = await request(app.getHttpServer())
      .get('/products?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`)
      .set('x-org', ORG)
      .expect(200);
    expect(Array.isArray(list.body.data)).toBe(true);

    // Delete
    await request(app.getHttpServer())
      .delete(`/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-org', ORG)
      .expect(200);
  });
});