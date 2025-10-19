# Social Business OS — Monorepo

Developer-first scaffold for building a multi-tenant “Business OS”.

## Prereqs

- **direnv** (recommended) – loads `.envrc` automatically
- **curl** and **jq** – our API helper scripts use them
- Node 18+ (if you’re building apps/web), Docker (optional but recommended)

## Quick Start (API)

```bash
cd apps/api

# 1) Load environment
direnv allow   # one-time; afterwards automatic

# Your .envrc should define:
# export BASE=http://localhost:4000
# export ORG=demo
# export API_EMAIL=tester@example.com
# export API_PASS=*****
```
## Quick test loop
```bash
direnv allow
pnpm prisma generate --schema=prisma/schema.prisma
pnpm prisma db push
ORG=demo API_EMAIL="tester@example.com" API_PASS="password123" pnpm prisma db seed
mkdir -p .tmp/jest-cache
TMPDIR="$(pwd)/.tmp" pnpm -F @repo/api test:e2e --cacheDirectory "$(pwd)/.tmp/jest-cache"

# API (NestJS + Prisma)

## Quickstart

```bash
# Postgres running locally on 5432
cp .env.example .env

# install
pnpm install
pnpm -C apps/api install

# migrate + seed (optional)
pnpm -C apps/api prisma:deploy
ORG=demo API_EMAIL=tester@example.com API_PASS=secret123 pnpm -C apps/api prisma db seed

# dev
pnpm -C apps/api dev
# or build + start
pnpm -C apps/api build && pnpm -C apps/api start

## Inventory API Quick Test

Use these curl commands to quickly verify inventory behavior without running the full test suite.

```bash

## Quick start (local)

```bash
pnpm -C apps/api build && pnpm -C apps/api start
# API: http://localhost:4000
# Swagger: http://localhost:4000/docs

### Quick demo
```bash
cd apps/api
cp .envrc.example .envrc   # edit if needed
direnv allow
make demo        # happy path
make heavy       # multiple orders + rollups
make errors      # guardrails (400s)