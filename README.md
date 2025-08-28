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
