// Centralized Prisma client (singleton) for the API app
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helpful in dev/watch to avoid open handles on process exit
process.on('beforeExit', async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // ignore
  }
});

export default prisma;