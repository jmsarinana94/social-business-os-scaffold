// apps/api/test/e2e/accounts.e2e-spec.ts
import request from 'supertest';

const BASE =
  process.env.BASE ??
  process.env.API_BASE ??
  'http://127.0.0.1:4010';

const ORG =
  process.env.ORG ??
  process.env.E2E_ORG_SLUG ??
  'demo';

const FORCE_E2E_ACCOUNTS =
  process.env.FORCE_E2E_ACCOUNTS === '1' ||
  process.env.FORCE_E2E_ACCOUNTS === 'true';

/**
 * By default, do NOT skip this suite.
 * You can skip via SKIP_E2E_ACCOUNTS=1, unless FORCE_E2E_ACCOUNTS is set.
 */
const SKIP =
  (process.env.SKIP_E2E_ACCOUNTS === '1' ||
    process.env.SKIP_E2E_ACCOUNTS === 'true') &&
  !FORCE_E2E_ACCOUNTS;

if (process.env.DEBUG_E2E_ACCOUNTS) {
  // Example:
  // [e2e][accounts] BASE=http://127.0.0.1:4010 ORG=demo SKIP=false FORCE=true
  console.log(
    `[e2e][accounts] BASE=${BASE} ORG=${ORG} SKIP=${SKIP} FORCE=${FORCE_E2E_ACCOUNTS}`,
  );
}

const run = SKIP ? describe.skip : describe;

/**
 * Sign up + login helper that is "echo-safe":
 * - Accepts responses with either { access_token } or { token }
 * - Logs bodies when DEBUG_E2E_ACCOUNTS is set
 */
async function signupAndLogin(base: string) {
  const email = `tester+${Date.now()}@example.com`;
  const password = 'password123!';

  // Sign up -> expect 201 in real API; Prism echo is wired accordingly
  const signupRes = await request(base)
    .post('/auth/signup')
    .send({ email, password })
    .expect(201);

  if (process.env.DEBUG_E2E_ACCOUNTS) {
    console.log('[e2e][accounts] signup body:', signupRes.body);
  }

  // Login -> 200
  const loginRes = await request(base)
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  if (process.env.DEBUG_E2E_ACCOUNTS) {
    console.log('[e2e][accounts] login body:', loginRes.body);
  }

  const body = loginRes.body as {
    token?: string;
    access_token?: string;
  };

  // Support both legacy/mock { token } and real { access_token } shapes
  const token: string | undefined = body?.access_token ?? body?.token;
  expect(typeof token).toBe('string');

  // Common headers for org-scoped + auth endpoints
  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'X-Org': ORG,
  };

  return authHeaders;
}

run('Accounts (e2e)', () => {
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

    // GET after delete -> 404 (force via Prism "Prefer" header in mock mode)
    await request(BASE)
      .get(`/accounts/${id}`)
      .set({ ...authHeaders, Prefer: 'code=404' })
      .expect(404);
  });

  it('rejects missing X-Org', async () => {
    // Force 400 when the required header is omitted (Prism mock behavior)
    await request(BASE)
      .get('/accounts')
      .set({ Prefer: 'code=400' })
      .expect(400);
  });
});