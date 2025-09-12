# Changelog

All notable changes to this project will be documented in this file.  
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.1.1] - 2025-09-12

### Added
- **Products CRUD hardened** with improved DTO validation and stricter service alignment.
- **Case-insensitive SKU uniqueness** using PostgreSQL `CITEXT` and Prisma `@@unique([orgId, sku])`.
- **@Org() decorator** for clean injection of the current organization into controllers.
- **Test-or-JWT guard** to bypass JWT auth in test environments.
- **Version controller** exposing `/version` endpoint.
- **E2E test** for duplicate SKU handling (`products.duplicate-sku.e2e-spec.ts`).

### Fixed
- Unified controller/service types and error handling for products and auth.
- Improved **Prisma exception filter** with clearer messages.
- Hardened **idempotency interceptor** (Redis-backed, TTL configurable).
- E2E tests stabilized: products, auth, smoke, and duplicate SKU all pass.

### Infrastructure
- Completed **Redis integration** with `RedisService` (`setnx`, `setex`, `get`, `del`, `setIfAbsent`).
- Feature toggles added for `IDEMPOTENCY_TTL`, `RATE_LIMIT_WINDOW`, and `RATE_LIMIT_MAX`.
- Updated **Prisma migrations** to include CITEXT extension and SKU constraint.

---

## [v0.1.0] - 2025-08-28

### Added
- **Baseline release** for the monorepo scaffold:
  - **API**: NestJS + Prisma with working **Products CRUD** (create, read, update, delete).
  - **Worker**: BullMQ scaffold for background jobs.
  - **Web**: Next.js App Router scaffold for dashboard + storefront shell.
  - **Shared Packages**:
    - `db`: Prisma schema + generated client.
    - `ui`: Shared Tailwind-ready components.
    - `config`: Shared tsconfig + ESLint/Prettier configs.
- **Smoke test suite** for API (health check + full CRUD).
- **.env.example** files for API, web, and worker.
- **GitHub Actions CI**: smoke workflow to verify baseline API CRUD.

### Notes
- This tag marks the **first working baseline** (`v0.1.0`) for Social Business OS.
- All future versions will build on this foundation: auth, org scoping, tenant isolation, and full SaaS modules.