# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /repo
ENV NODE_ENV=production
RUN corepack enable

# minimal files to wire the workspace quickly
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma/schema.prisma apps/api/prisma/schema.prisma

# install all workspace deps (honors lockfile)
RUN pnpm install --frozen-lockfile

# prisma client for the API package
RUN pnpm -C apps/api exec prisma generate --schema prisma/schema.prisma

# bring in the source and build
COPY . .
RUN pnpm -C apps/api build

# ✅ export a self-contained deployable for the API (dist + node_modules + package.json)
RUN pnpm -w -r deploy --filter "./apps/api" /out

# ---------- runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app

# copy the exported app
COPY --from=build /out ./

EXPOSE 4000
CMD ["node", "dist/src/main.js"]