# ---------------------------------------
# STAGE 1 — builder
# ---------------------------------------
FROM node:20-alpine AS builder
WORKDIR /repo

# Enable pnpm via Corepack
RUN corepack enable

# Install basic build deps (openssl required for Prisma on alpine)
RUN apk add --no-cache openssl

# Copy workspace manifests FIRST for better layer caching
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Install all workspace deps (dev + prod) for building
RUN pnpm install --frozen-lockfile

# Copy only the API app and anything it needs to build (src + prisma + ts configs)
COPY apps/api ./apps/api

# Build the Nest app (outputs CJS to apps/api/dist/**)
RUN pnpm -C apps/api build

# Generate Prisma Client targeting alpine (musl) — run from the API app folder
# so prisma picks up apps/api/prisma/schema.prisma and writes node_modules/@prisma/client
RUN pnpm -C apps/api exec prisma generate --schema=prisma/schema.prisma

# Optional: minimize node_modules to production only after build
# (Keeps what's needed for runtime while allowing dev deps for the build step above)
RUN pnpm prune --prod


# ---------------------------------------
# STAGE 2 — runtime
# ---------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

# Copy production node_modules (already pruned), built dist, prisma folder, and API package.json
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/prisma ./prisma
COPY --from=builder /repo/apps/api/package.json ./package.json

# If you read env vars from prisma/.env at runtime, you can mount one or bake it in:
# COPY apps/api/prisma/.env ./prisma/.env

EXPOSE 4000

# Healthcheck is optional but handy in containers/compose
# HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1:4000/health || exit 1

# Run the compiled CommonJS bundle
CMD ["node", "dist/main.js"]