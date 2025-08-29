# Changelog

All notable changes to this project will be documented in this file.  
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
