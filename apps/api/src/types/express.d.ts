import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Populated by OrgMiddleware */
      org?: { id: string; slug: string };
      orgId?: string;
      orgSlug?: string;

      /** Populated by IdempotencyInterceptor */
      idempotencyKey?: string;
    }
  }
}

export { };
