// apps/api/test/e2e/contacts.e2e-spec.ts

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Contacts (e2e)', () => {
  let app: INestApplication;
  const orgSlug = process.env.E2E_ORG_SLUG || 'demo';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Match existing global validation setup
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('CRUD within org', async () => {
    const server = app.getHttpServer();
    const emailSuffix = Date.now();

    // CREATE
    const createRes = await request(server)
      .post('/contacts')
      .set('x-org', orgSlug)
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: `jane+${emailSuffix}@example.com`,
      })
      .expect(201);

    const id = createRes.body?.id;
    expect(typeof id).toBe('string');

    // LIST
    const listRes = await request(server)
      .get('/contacts')
      .set('x-org', orgSlug)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    const found = listRes.body.find((c: any) => c.id === id);
    expect(found).toBeDefined();
    expect(found.firstName).toBe('Jane');

    // UPDATE
    const updateRes = await request(server)
      .patch(`/contacts/${id}`)
      .set('x-org', orgSlug)
      .send({ lastName: 'Updated' })
      .expect(200);

    expect(updateRes.body.lastName).toBe('Updated');

    // DELETE
    await request(server)
      .delete(`/contacts/${id}`)
      .set('x-org', orgSlug)
      .expect(204);
  });

  it('rejects missing X-Org', async () => {
    const server = app.getHttpServer();

    await request(server)
      .get('/contacts')
      .expect(400);
  });
});