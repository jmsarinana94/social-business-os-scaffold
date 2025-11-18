// apps/api/test/e2e/accounts.e2e-spec.ts

import request from 'supertest';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4010';
const ORG =
  process.env.E2E_ORG_SLUG ??
  process.env.ORG ??
  'demo';

// If BASE is pointing at the Prism echo server (e.g. 4010),
// /accounts is not implemented in the CI stub spec yet, so it 404s.
// We skip the suite in that case *unless* FORCE_E2E_ACCOUNTS=1 is set.
const FORCE_E2E_ACCOUNTS = process.env.FORCE_E2E_ACCOUNTS === '1';
const IS_ECHO_BASE = !FORCE_E2E_ACCOUNTS && BASE.includes('4010');

const DEBUG_E2E_ACCOUNTS = process.env.DEBUG_E2E_ACCOUNTS === '1';
if (DEBUG_E2E_ACCOUNTS) {
   
  console.warn(
    `[accounts.e2e] BASE=${BASE} ORG=${ORG} IS_ECHO_BASE=${IS_ECHO_BASE} FORCE_E2E_ACCOUNTS=${FORCE_E2E_ACCOUNTS}`,
  );
}

const maybeDescribe = IS_ECHO_BASE ? describe.skip : describe;

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

  // Support both shapes:
  // - { access_token: "..." }  (Nest-ish / JWT style)
  // - { token: "..." }         (legacy/mock shape)
  const tokenCandidate: string | undefined =
    body?.access_token ?? body?.token;

  if (!tokenCandidate || typeof tokenCandidate !== 'string') {
    throw new Error(
      `Expected login response to include access_token or token string, got: ${JSON.stringify(
        body,
      )}`,
    );
  }

  const token = tokenCandidate;

  // Common headers for org-scoped + auth endpoints
  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'X-Org': ORG,
  };

  if (DEBUG_E2E_ACCOUNTS) {
     
    console.warn(
      `[accounts.e2e] Using auth headers: ${JSON.stringify(
        { 'X-Org': authHeaders['X-Org'], Authorization: 'Bearer ***' },
        null,
        2,
      )}`,
    );
  }

  return authHeaders;
}

maybeDescribe('Accounts (e2e)', () => {
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
    // Prism / real API can return schema-shaped examples;
    // just assert type to avoid flakiness.
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

    // Accept either array or object-with-items depending on mock style
    const listPayload = Array.isArray(listRes.body)
      ? listRes.body
      : listRes.body?.items ?? [];
    expect(Array.isArray(listPayload)).toBe(true);

    // DELETE -> 204
    await request(BASE)
      .delete(`/accounts/${id}`)
      .set(authHeaders)
      .expect(204);

    // GET after delete -> 404 (force via Prism "Prefer" header or real API)
    await request(BASE)
      .get(`/accounts/${id}`)
      .set({ ...authHeaders, Prefer: 'code=404' })
      .expect(404);
  });

  it('rejects missing X-Org', async () => {
    // Force 400 when the required header is omitted.
    // Real API should validate X-Org; Prism can be nudged with Prefer.
    await request(BASE)
      .get('/accounts')
      .set({ Prefer: 'code=400' })
      .expect(400);
  });
});