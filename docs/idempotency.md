# Idempotency on POST /products

## How to use
Send a unique `Idempotency-Key` header with each POST `/products` request.

```http
POST /products
Idempotency-Key: 8bde39b2-0597-4c2e-8d80-7f3d29d6d3b6
x-org: acme
Content-Type: application/json