[![API Smoke](https://github.com/jmsarinana94/social-business-os-scaffold/actions/workflows/api-smoke.yml/badge.svg)](https://github.com/jmsarinana94/social-business-os-scaffold/actions/workflows/api-smoke.yml)
[![API E2E Tests](https://github.com/jmsarinana94/social-business-os-scaffold/actions/workflows/api-e2e.yml/badge.svg)](https://github.com/jmsarinana94/social-business-os-scaffold/actions/workflows/api-e2e.yml)

# Social Media Business OS — Monorepo Scaffold (v0.2)

A starter monorepo scaffold for building a robust, modular Business OS with:

- **`apps/web`** — Next.js (App Router) dashboard + storefront shell
- **`apps/api`** — NestJS REST API (multi-tenant modular monolith)
- **`apps/worker`** — BullMQ worker for background jobs
- **`packages/db`** — Prisma schema + generated client
- **`packages/ui`** — Shared UI components (Tailwind-ready)
- **`packages/config`** — Shared tsconfig + eslint configs

---

## Quick Start

1. **Install pnpm (if needed):**
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   ```
## Running E2E tests locally

Make sure you have Postgres running and `.env` contains a valid `DATABASE_URL`.  
The tests expect a demo user: `tester@example.com / password123`.

### Quick start
```bash
# Seed demo user + run e2e tests
pnpm -F @repo/api db:seed:demo
pnpm -F @repo/api e2e:quick