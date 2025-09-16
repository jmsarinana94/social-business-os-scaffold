// apps/api/test/e2e/products.inventory.e2e-spec.ts
import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request, { Response } from 'supertest';

const ORG = process.env.ORG || 'demo';
const PASS = process.env.API_PASS || 'password123';
// ALWAYS unique per run, do NOT read process.env.API_EMAIL
const EMAIL = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@demo.io`;

describe('Products inventory (e2e)', () => {
  let app: INestApplication;
  let token: string;

  const base = () => request(app.getHttpServer());
  const baseHeaders = { 'x-org': ORG, 'content-type': 'application/json' };

  async function signup(): Promise<void> {
    // Accept 201 Created or 409 Conflict (already exists)
    await base()
      .post('/auth/signup')
      .set(baseHeaders)
      .send({ email: EMAIL, password: PASS, name: 'Inventory Tester' })
      .ok(res => res.status === 201 || res.status === 409);
  }

  async function login(): Promise<Response> {
    return base()
      .post('/auth/login')
      .set(baseHeaders)
      .send({ email: EMAIL, password: PASS });
  }

  async function ensureLogin(): Promise<string> {
    let res = await login();
    if (res.status === 401) {
      await signup();
      res = await login();
    }
    if (!(res.status === 200 || res.status === 201)) {
      throw new Error(`Login failed: expected 200/201, got ${res.status} (${res.text})`);
    }
    const tk: string | undefined = res.body?.access_token;
    if (!tk) throw new Error(`Missing access_token: ${JSON.stringify(res.body)}`);
    return tk;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await signup();
    token = await ensureLogin();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists products and adjusts inventory +5, then rejects negative overshoot', async () => {
    // 1) List products
    const list = await base()
      .get('/products')
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .expect(200);

    const items = list.body?.data ?? [];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);

    const product = items[0];
    expect(product).toHaveProperty('id');
    expect(typeof product.inventoryQty).toBe('number');

    // 2) Adjust +5 (accept 200 or 201)
    const up = await base()
      .post(`/products/${product.id}/inventory`)
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({ delta: 5 })
      .ok(r => r.status === 200 || r.status === 201);

    const newQty = up.body?.inventoryQty;
    expect(typeof newQty).toBe('number');
    expect(newQty).toBe(product.inventoryQty + 5);

    // 3) Attempt negative overshoot (should 400)
    const negDelta = -(newQty + 1);
    await base()
      .post(`/products/${product.id}/inventory`)
      .set({ ...baseHeaders, Authorization: `Bearer ${token}` })
      .send({ delta: negDelta })
      .expect(400);
  });
});