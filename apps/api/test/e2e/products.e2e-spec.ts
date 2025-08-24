 
// @ts-nocheck

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Products (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products returns paginated list', async () => {
    const res = await request(app.getHttpServer())
      .get('/products?page=1&limit=5')
      .set('x-org', 'demo')
      .expect(200);

    const body = res.body?.data ?? res.body; // supports wrapped/unwrapped
    const list = body.data ?? body;
    const meta = body.meta;

    expect(Array.isArray(list)).toBe(true);
    if (meta) expect(meta.page).toBe(1);
  });

  it('POST -> GET -> PUT (partial) -> DELETE', async () => {
    // create
    const created = await request(app.getHttpServer())
      .post('/products')
      .set('content-type', 'application/json')
      .set('x-org', 'demo')
      .send({
        title: 'Jest Shirt',
        type: 'physical',
        price: 1999,
        status: 'active',
        description: null,
      })
      .expect(201);

    const createdObj = created.body?.data ?? created.body;
    const id = createdObj.id;
    expect(id).toBeTruthy();

    // read
    const got = await request(app.getHttpServer())
      .get(`/products/${id}`)
      .set('x-org', 'demo')
      .expect(200);
    const readObj = got.body?.data ?? got.body;
    expect(readObj.id).toBe(id);

    // update (partial; only title) — should be 200 OK
    const updated = await request(app.getHttpServer())
      .put(`/products/${id}`)
      .set('content-type', 'application/json')
      .set('x-org', 'demo')
      .send({ title: 'Jest Shirt v2' })
      .expect(200);
    const updObj = updated.body?.data ?? updated.body;
    expect(String(updObj.title)).toMatch(/v2/);

    // delete
    await request(app.getHttpServer())
      .delete(`/products/${id}`)
      .set('x-org', 'demo')
      .expect(200);
  });
});