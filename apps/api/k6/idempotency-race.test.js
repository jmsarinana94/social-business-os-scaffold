// apps/api/k6/idempotency-race.test.js
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 25,
  iterations: 75,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:4000';
const ORG = __ENV.ORG || 'acme';

// one shared idempotency key & SKU for the whole run
const IDEM_KEY = uuidv4();
const SKU = `CAP-${Math.floor(10000 + Math.random() * 89999)}`;

export default function () {
  const body = JSON.stringify({
    title: 'Cap',
    price: '14.99',
    type: 'physical',
    status: 'active',
    sku: SKU,
  });

  const res = http.post(`${BASE_URL}/products`, body, {
    headers: {
      'content-type': 'application/json',
      'x-org': ORG,
      'idempotency-key': IDEM_KEY,
    },
  });

  // Accept either initial 201 or replayed 201 with header
  const ok = check(res, {
    'status is 201 or 200': (r) => r.status === 201 || r.status === 200,
  });

  if (!ok) {
    console.error('Unexpected response:', res.status, res.body);
  }

  sleep(0.1);
}