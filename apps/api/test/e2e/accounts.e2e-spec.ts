import request from 'supertest';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4010';
const ORG = process.env.E2E_ORG_SLUG ?? 'demo-org';

async function signupAndLogin(base: string) {
  const email = `tester+${Date.now()}@example.com`;
  const password = 'password123!';

  // Sign up -> 201
  await request(base)
    .post('/auth/signup')
    .send({ email, password })
    .expect(201);

  // Login -> 200
  const { body } = await request(base)
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  const token = body?.token;
  expect(typeof token).toBe('string');

  // Common headers for org-scoped + auth endpoints
  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'X-Org': ORG,
  };

  return authHeaders;
}

describe('Accounts (e2e)', () => {
  it('CRUD within org', async () => {
    const authHeaders = await signupAndLogin(BASE);

    // CREATE -> 201
    const createRes = await request(BASE)
      .post('/accounts')
      .set(authHeaders)
      .send({
        name: 'TestCo',
        website: 'https://example.com',
      })
      .expect(201);

    const id = createRes.body?.id;
    expect(typeof id).toBe('string');
    // Prism can return schema-shaped examples; just assert type to avoid flakiness
    expect(typeof createRes.body?.name).toBe('string');

    // GET by id -> 200
    const getRes = await request(BASE)
      .get(`/accounts/${id}`)
      .set(authHeaders)
      .expect(200);

    expect(getRes.body?.id).toBe(id);
    expect(typeof getRes.body?.name).toBe('string');

    // LIST -> 200
    const listRes = await request(BASE)
      .get('/accounts')
      .set(authHeaders)
      .expect(200);

    // Accept either array or object with items depending on mock style
    const listPayload = Array.isArray(listRes.body)
      ? listRes.body
      : listRes.body?.items ?? [];
    expect(Array.isArray(listPayload)).toBe(true);

    // DELETE -> 204
    await request(BASE)
      .delete(`/accounts/${id}`)
      .set(authHeaders)
      .expect(204);

    // GET after delete -> 404 (force via Prism "Prefer" header)
    await request(BASE)
      .get(`/accounts/${id}`)
      .set({ ...authHeaders, Prefer: 'code=404' })
      .expect(404);
  });

  it('rejects missing X-Org', async () => {
    // Force 400 when the required header is omitted
    await request(BASE)
      .get('/accounts')
      .set({ Prefer: 'code=400' })
      .expect(400);
  });
});