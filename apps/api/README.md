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
