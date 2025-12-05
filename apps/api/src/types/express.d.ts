// apps/api/src/types/express.d.ts

import 'express';

declare global {
  namespace Express {
    /**
     * Extends the base Express.Request type
     * to include multi-tenant and idempotency metadata.
     * These fields are populated by corresponding middleware/interceptors.
     */
    interface Request {
      /**
       * Populated by OrgScopeMiddleware or OrgGuard
       * — used for tenant scoping.
       */
      org?: {
        id: string;
        slug: string;
      };

      /** Convenience fields derived from org */
      orgId?: string;
      orgSlug?: string;

      /**
       * Populated by IdempotencyInterceptor
       * — used to deduplicate repeated requests safely.
       */
      idempotencyKey?: string;

      /**
       * Populated by TenantContext or RequestContextService
       * — unified access to the active tenant in context.
       */
      tenant?: {
        orgId: string;
        orgSlug: string | null;
      };
    }
  }
}

export { };
