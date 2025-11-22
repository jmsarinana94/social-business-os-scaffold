import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const BASE = process.env.API_BASE || process.env.BASE || 'http://127.0.0.1:4010';
const ORG_SLUG = process.env.E2E_ORG_SLUG || 'demo';
const FORCE = process.env.FORCE_E2E_CONTACTS === '1';
const SKIP = process.env.SKIP_E2E_CONTACTS === '1' && !FORCE;

if (process.env.DEBUG_E2E_CONTACTS === '1' || FORCE) {
   
  console.log(
    `[e2e][contacts] BASE=${BASE} ORG=${ORG_SLUG} SKIP=${SKIP} FORCE=${FORCE}`,
  );
}

describe('Contacts (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    if (SKIP) {
      return;
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const maybeIt = SKIP ? it.skip : it;

  maybeIt('CRUD within org', async () => {
    const server = app.getHttpServer();
    const emailSuffix = Date.now().toString();

    // CREATE
    const createRes = await request(server)
      .post('/contacts')
      .set('X-Org', ORG_SLUG)
      .send({
        name: 'Jane Doe',
        email: `jane+${emailSuffix}@example.com`,
      })
      .expect(201);

    const id = createRes.body?.id;
    expect(typeof id).toBe('string');

    // LIST
    const listRes = await request(server)
      .get('/contacts')
      .set('X-Org', ORG_SLUG)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((c: any) => c.id === id)).toBe(true);

    // UPDATE
    const updateRes = await request(server)
      .patch(`/contacts/${id}`)
      .set('X-Org', ORG_SLUG)
      .send({
        name: 'Jane Updated',
      })
      .expect(200);

    expect(updateRes.body.name).toBe('Jane Updated');

    // DELETE
    await request(server)
      .delete(`/contacts/${id}`)
      .set('X-Org', ORG_SLUG)
      .expect(204);
  });

  maybeIt('rejects missing X-Org', async () => {
    const server = app.getHttpServer();

    await request(server)
      .get('/contacts')
      // No X-Org header
      .expect(400);
  });
});