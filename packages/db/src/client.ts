import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Re-export Prisma types so other packages can import them from @repo/db
export * from '@prisma/client';
