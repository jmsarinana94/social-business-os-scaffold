import { defineConfig } from '@prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  // explicitly load your DB env from the right place
  dotenv: { path: ['./prisma/.env'] },
})