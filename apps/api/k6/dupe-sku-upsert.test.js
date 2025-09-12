import { check } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:4000';
const ORG = __ENV.ORG || 'acme';

export const options = {
  vus: 10,
  iterations: 30,
};

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function () {
  const SKU = `CAP-${Math.floor(10000 + Math.random() * 89999)}`;
  const IK_A = uuid();
  const IK_B = uuid();

  // 1) Create
  const createRes = http.post(
    `${BASE_URL}/products`,
    JSON.stringify({
      title: 'Cap',
      price: '14.99',
      type: 'physical',
      status: 'active',
      sku: SKU,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'x-org': ORG,
        'Idempotency-Key': IK_A,
      },
    },
  );

  check(createRes, {
    'create is 201': (r) => r.status === 201,
  });

  // 2) Different key + same SKU -> expect 200 + Upsert-Existing:true
  const upsertRes = http.post(
    `${BASE_URL}/products`,
    JSON.stringify({
      title: 'Cap dup',
      price: '14.99',
      type: 'physical',
      status: 'active',
      sku: SKU,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'x-org': ORG,
        'Idempotency-Key': IK_B,
      },
    },
  );

  check(upsertRes, {
    'upsert existing is 200': (r) => r.status === 200,
    'header Upsert-Existing present': (r) => !!r.headers['Upsert-Existing'],
  });
}