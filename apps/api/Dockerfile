# -------- builder --------
FROM node:20-alpine AS builder
WORKDIR /app

# enable pnpm
RUN corepack enable

# copy root manifests
COPY package.json pnpm-lock.yaml ./

# install deps
RUN pnpm install --frozen-lockfile

# copy source + prisma
COPY apps/api ./apps/api
COPY prisma ./prisma

# build API
RUN pnpm -C apps/api build

# generate Prisma Client (uses /prisma/schema.prisma)
RUN npx prisma@6.14.0 generate --schema=prisma/schema.prisma

# -------- runtime --------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

# copy runtime artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

EXPOSE 4000

# You can add an entrypoint to migrate on boot if desired. We keep it simple:
CMD ["node", "dist/main.js"]