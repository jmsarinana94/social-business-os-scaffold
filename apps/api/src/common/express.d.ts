import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    /**
     * ID of the Organization resolved from the `x-org` header.
     */
    orgId?: string;

    /**
     * Optional convenience snapshot of the organization.
     * Only set if you need it (not required by the tests).
     */
    org?: {
      id: string;
      slug: string | null;
      name: string | null;
    };
  }
}