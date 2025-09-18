export function rethrowPrismaError(e: unknown) {
  // Narrow by code in Prisma v6
  if (isCode(e, 'P2002')) {
    const err = new Error('Unique constraint violation');
    (err as any).status = 409;
    throw err;
  }
  if (isCode(e, 'P2025')) {
    const err = new Error('Record not found');
    (err as any).status = 404;
    throw err;
  }
  throw e;
}

function isCode(ex: unknown, code: string): ex is { code: string } {
  return !!ex && typeof ex === 'object' && 'code' in ex && (ex as any).code === code;
}