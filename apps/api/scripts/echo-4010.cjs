// apps/api/scripts/echo-4010.cjs

const http = require('http')
const { URL } = require('url')

const PORT = 4010

// In-memory stores for echo data
const accounts = new Map()

/**
 * Helper: check if incoming path matches a simple route,
 * allowing both "/route" and "/v1/route".
 */
function matchesPath(pathname, target) {
  return pathname === target || pathname === `/v1${target}`
}

/**
 * Helper: send JSON response
 */
function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

/**
 * Helper: parse JSON body (best-effort)
 */
function parseBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      if (!data) return resolve({})
      try {
        resolve(JSON.parse(data))
      } catch {
        resolve({})
      }
    })
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname
  const method = req.method.toUpperCase()

  const orgHeader = req.headers['x-org'] || req.headers['x-org-id']
  const orgSlug = orgHeader || process.env.E2E_ORG_SLUG || 'demo'
  const prefer = (req.headers['prefer'] || '').toString().toLowerCase()

  const body = await parseBody(req)

  // ---------- AUTH ENDPOINTS ----------

  // POST /auth/signup  (echo version)
  if (method === 'POST' && matchesPath(pathname, '/auth/signup')) {
    const { email } = body
    const token = 'echo-signup-token'

    return sendJson(res, 201, {
      token,
      access_token: token, // for tests that expect access_token
      user: {
        id: 'echo-user-id',
        email: email || 'tester@example.com',
        org: orgSlug,
      },
    })
  }

  // POST /auth/login  (echo version)
  if (method === 'POST' && matchesPath(pathname, '/auth/login')) {
    const token = 'echo-login-token'

    return sendJson(res, 200, {
      token,
      access_token: token, // for tests that expect access_token
    })
  }

  // ---------- ACCOUNTS ENDPOINTS ----------

  // POST /accounts -> create account
  if (method === 'POST' && matchesPath(pathname, '/accounts')) {
    // NOTE: accounts tests always send X-Org here, so we don't
    // need to enforce missing-header behavior on POST.
    const id = body.id || 'echo-account-id'
    const name = body.name || 'Echo Account'

    const account = { id, name, org: orgSlug }
    accounts.set(id, account)

    return sendJson(res, 201, account)
  }

  // GET /accounts/:id  (and /v1/accounts/:id)
  if (
    method === 'GET' &&
    (pathname.startsWith('/accounts/') || pathname.startsWith('/v1/accounts/'))
  ) {
    const prefix = pathname.startsWith('/v1/accounts/') ? '/v1/accounts/' : '/accounts/'
    const id = pathname.slice(prefix.length)

    const account = accounts.get(id)
    if (!account) {
      return sendJson(res, 404, { error: 'Account not found', id })
    }

    return sendJson(res, 200, account)
  }

  // GET /accounts -> list accounts
  if (method === 'GET' && matchesPath(pathname, '/accounts')) {
    // 🧪 Special case for the e2e test:
    // When no X-Org header AND Prefer: code=400, we must respond 400.
    if (!orgHeader && prefer.includes('code=400')) {
      return sendJson(res, 400, {
        statusCode: 400,
        error: 'Bad Request',
        message: 'X-Org header required',
      })
    }

    const list = Array.from(accounts.values())
    return sendJson(res, 200, list)
  }

  // PUT /accounts/:id -> update account
  if (
    method === 'PUT' &&
    (pathname.startsWith('/accounts/') || pathname.startsWith('/v1/accounts/'))
  ) {
    const prefix = pathname.startsWith('/v1/accounts/') ? '/v1/accounts/' : '/accounts/'
    const id = pathname.slice(prefix.length)

    const prev = accounts.get(id)
    if (!prev) {
      return sendJson(res, 404, { error: 'Account not found', id })
    }

    const updated = {
      ...prev,
      ...body,
      id, // keep id stable
      org: orgSlug, // keep org in sync
    }
    accounts.set(id, updated)

    return sendJson(res, 200, updated)
  }

  // DELETE /accounts/:id
  if (
    method === 'DELETE' &&
    (pathname.startsWith('/accounts/') || pathname.startsWith('/v1/accounts/'))
  ) {
    const prefix = pathname.startsWith('/v1/accounts/') ? '/v1/accounts/' : '/accounts/'
    const id = pathname.slice(prefix.length)

    accounts.delete(id)
    res.statusCode = 204
    return res.end()
  }

  // ---------- FALLBACK ECHO ----------

  return sendJson(res, 200, {
    ok: true,
    method,
    path: pathname,
    org: orgSlug,
    headers: req.headers,
    body,
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🔁 Echo server listening on http://127.0.0.1:${PORT}/v1`)
})
