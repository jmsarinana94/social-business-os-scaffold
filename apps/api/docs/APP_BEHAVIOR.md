# Business OS API — App Behavior (Expected Now)

_Last updated: today_

This document describes how the API currently behaves, including request/response contracts, headers, idempotency, enum handling, validation, persistence, and operational concerns.

---

## 1) Service Overview

- **Framework:** NestJS
- **DB:** PostgreSQL via Prisma Client
- **Cache/Locks:** Redis (`ioredis`)
- **Port:** `4000` (configurable by `PORT`)
- **Auth:** (placeholder for now)
- **Org scoping:** via required header `x-org: <slug>`

### Health

- `GET /health` → `200 OK` `{ "status": "ok" }` (basic liveness)

---

## 2) Organization Scoping

All business endpoints require the `x-org` header.  
Middleware resolves the organization row by `slug`:

- Looks up `Organization.slug = <x-org>`
- Rejects if missing or not found:
  - Missing header → `400 Bad Request` (`Missing x-org header`)
  - Not found → `400 Bad Request` (`Unknown org`)

> **Note:** Organizations are stored with UUID primary keys; we resolve by slug, then pass the organization `id` to all queries/mutations.

---

## 3) Data Model (Prisma)

### Enums (DB values ↔ API values)

- `ProductType`:
  - **API values:** `"PHYSICAL" | "DIGITAL"`
  - **Stored in DB (mapped):** `"physical" | "digital"`

- `ProductStatus`:
  - **API values:** `"ACTIVE" | "INACTIVE"`
  - **Stored in DB (mapped):** `"active" | "inactive"`

### Tables

**Organization**

- `id` (UUID pk, default `gen_random_uuid()`)
- `slug` (unique)
- `name`
- timestamps

**Product**

- `id` (cuid)
- `orgId` (UUID, FK → Organization, cascade on delete)
- `title` (string)
- `type` (`ProductType`, required)
- `description` (nullable)
- `price` (Decimal(30,2))
- `sku` (varchar(64), nullable)
- `inventoryQty` (int, default 0)
- `status` (`ProductStatus`, default `ACTIVE`)
- timestamps
- **Indexes / Constraints:**
  - `@@index([orgId, createdAt])`
  - `@@unique([orgId, sku], map: "Product_org_sku_unique")` (**enforced**)

---

## 4) Products API

### 4.1 List

**GET** `/products`  
**Headers:** `x-org: <slug>`

**Query params (optional):**

- `page` (default `1`)
- `limit` (default `10`, sensible max enforced)
- **[Future]** filters (status, type, search)

**Response:**

```json
{
  "data": [
    {
      "id": "cmf...",
      "orgId": "uuid",
      "title": "Cap",
      "type": "PHYSICAL",
      "description": "Black dad hat",
      "price": "14.99",
      "sku": "CAP-001",
      "inventoryQty": 0,
      "status": "ACTIVE",
      "createdAt": "2025-09-01T02:23:02.108Z",
      "updatedAt": "2025-09-01T02:23:02.108Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
}
```
