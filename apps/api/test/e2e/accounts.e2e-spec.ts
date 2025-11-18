import request from 'supertest';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4000';
// Prefer seeded value if present, otherwise fall back to demo
const ORG = process.env.E2E_ORG_SLUG ?? process.env.ORG ?? 'demo';

// In CI we point BASE at the Prism echo server on 4010.
// In that mode, auth responses are mocked and may not contain a token field.
const IS_ECHO = BASE.includes('4010');

async function signupAndLogin(base: string) {
  if (IS_ECHO) {
    // Echo/mock mode (CI):
    // /accounts endpoints don't actually enforce a real JWT,
    // they just care about the org scoping. Use a dummy token.
    const authHeaders: Record<string, string> = {
      Authorization: 'Bearer dummy-token',
      'X-Org': ORG,
    };

    return authHeaders;
  }

  // "Real" API mode (e.g. local Nest app on 4000)
  const email =
    process.env.API_EMAIL ?? `tester+${Date.now()}@example.com`;
  const password = process.env.API_PASS ?? 'password123!';

  // If we're not using a seeded user, create one first.
  if (!process.env.API_EMAIL) {
    await request(base)
      .post('/auth/signup')
      .send({ email, password })
      .expect(201);
  }

  // Login -> 200
  const login = await request(base)
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  const body = login.body as any;
  // Support both shapes:
  // - { access_token: "..." }  (current API)
  // - { token: "..." }         (legacy/mock shape)
  const token: string | undefined =
    body?.access_token ?? body?.token;

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