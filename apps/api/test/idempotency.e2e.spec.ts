import request from 'supertest';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4000';
const ORG = process.env.ORG || 'acme';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

describe('Idempotency e2e', () => {
  const SKU = `CAP-${Math.floor(10000 + Math.random() * 90000)}`;
  const IK_A = uuid();
  const IK_B = uuid();

  it('1) create (new key) → 201', async () => {
    const res = await request(BASE_URL)
      .post('/products')
      .set('Content-Type', 'application/json')
      .set('x-org', ORG)
      .set('Idempotency-Key', IK_A)
      .send({ title: 'Cap', price: '14.99', type: 'physical', status: 'active', sku: SKU });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('sku', SKU);
  });

  it('2) same key + same body → replay (200 or 201) **with Idempotency-Replayed header**', async () => {
    const res = await request(BASE_URL)
      .post('/products')
      .set('Content-Type', 'application/json')
      .set('x-org', ORG)
      .set('Idempotency-Key', IK_A)
      .send({ title: 'Cap', price: '14.99', type: 'physical', status: 'active', sku: SKU });

    expect([200, 201]).toContain(res.status);
    // header should be present on replay
    expect(res.headers['idempotency-replayed']).toBeDefined();
    expect(res.body).toHaveProperty('sku', SKU);
  });

  it('3) same key + different body → 409 (strict conflict)', async () => {
    const res = await request(BASE_URL)
      .post('/products')
      .set('Content-Type', 'application/json')
      .set('x-org', ORG)
      .set('Idempotency-Key', IK_A)
      .send({ title: 'Cap (edited)', price: '19.99', type: 'physical', status: 'active', sku: SKU });

    expect(res.status).toBe(409);
    expect((res.body?.message || '').toLowerCase()).toMatch(/idempotency-key already used/i);
  });

  it('4) different key + same SKU → 200 + Upsert-Existing:true and only one row', async () => {
    const res = await request(BASE_URL)
      .post('/products')
      .set('Content-Type', 'application/json')
      .set('x-org', ORG)
      .set('Idempotency-Key', IK_B)
      .send({ title: 'Cap dup', price: '14.99', type: 'physical', status: 'active', sku: SKU });

    expect(res.status).toBe(200);
    expect(res.headers['upsert-existing']).toBeDefined();

    const list = await request(BASE_URL).get('/products').set('Content-Type', 'application/json').set('x-org', ORG);
    const items = (list.body?.data || []).filter((p: any) => p.sku === SKU);
    expect(items.length).toBe(1);
  });
});