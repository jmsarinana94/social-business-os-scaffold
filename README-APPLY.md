# Patch: API quality-of-life

## Files added
- `apps/api/.envrc`
- `apps/api/prisma/.env.example`
- `apps/api/prisma/seed.ts`
- `apps/api/src/health/health.module.ts`
- `apps/api/src/health/health.controller.ts`
- `apps/api/src/config/env.ts`
- `.github/workflows/api-e2e.yml`
- `scripts/dev.sh`
- `apps/api/package.partial.json`

## Apply
From repo root:
```bash
chmod +x scripts/dev.sh
cd apps/api && direnv allow && cd -
pnpm -F @repo/api add -D ts-node