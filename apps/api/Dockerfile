# apps/api/Dockerfile
# syntax=docker/dockerfile:1.7

#####################################
# Base with pnpm
#####################################
FROM node:20-alpine AS base
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

#####################################
# Install deps (workspace-aware)
#####################################
FROM base AS deps

# Root workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Packages that API may depend on
COPY packages ./packages

# API package manifest (so pnpm can resolve workspace deps)
COPY apps/api/package.json ./apps/api/package.json

# Install all workspace deps (not production yet; we need dev deps to build)
RUN pnpm install --frozen-lockfile=false

#####################################
# Build the API
#####################################
FROM deps AS build

# Copy sources
COPY tsconfig*.json ./
COPY apps/api ./apps/api
COPY packages ./packages

# (Optional) Prisma generate if you use Prisma (uncomment if needed)
# RUN pnpm --filter ./apps/api... prisma generate

# Build only the API app
RUN pnpm --filter ./apps/api... build

#####################################
# Runtime image
#####################################
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Copy the API dist and its package.json
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json

# Copy node_modules from the monorepo (contains all resolved workspace deps)
COPY --from=build /repo/node_modules ./node_modules
# If your API has its own local node_modules (usually empty with workspaces), keep this line:
# COPY --from=build /repo/apps/api/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "dist/main.js"]