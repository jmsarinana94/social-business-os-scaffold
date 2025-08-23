# Social Media Business OS — Monorepo Scaffold (v0.2)

This is a starter monorepo using Turborepo with:

- `apps/web` — Next.js (App Router) dashboard + storefront shell
- `apps/api` — NestJS REST API (multi-tenant modular monolith)
- `apps/worker` — BullMQ worker for background jobs
- `packages/db` — Prisma schema + generated client
- `packages/ui` — Shared UI components (Tailwind-ready)
- `packages/config` — Shared tsconfig + eslint configs

## Quick Start

1. Install pnpm if needed:
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   ```
2. Install deps
   ```bash
   pnpm install
   ```
3. Set up env files
   - Copy `.env.example` files to `.env` in each app/package as needed
4. Dev
   ```bash
   pnpm dev
   ```
5. Prisma DB (Postgres)
   ```bash
   pnpm -C packages/db prisma migrate dev
   ```

## Environments

- Postgres: set `DATABASE_URL` in `apps/api/.env` and `packages/db/.env`
- Redis: set `REDIS_URL` in `apps/worker/.env`
- Stripe: set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `apps/api/.env`
- Web → API: set `NEXT_PUBLIC_API_URL` in `apps/web/.env`
