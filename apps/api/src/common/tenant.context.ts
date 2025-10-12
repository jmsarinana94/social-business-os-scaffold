// apps/api/src/common/tenant.context.ts
import {
    BadRequestException,
    ExecutionContext,
    Inject,
    Injectable,
    Scope,
    createParamDecorator,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

//
// Types
//
export interface TenantInfo {
  orgId?: string | null;
  orgSlug?: string | null;
}

//
// Global augmentation for Express.Request
//
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantInfo;
    }
  }
}

//
// Request-scoped accessor used across services
//
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly req: Request) {}

  /** Returns orgId if present, otherwise undefined */
  getOrgId(): string | undefined {
    return this.req.tenant?.orgId ?? undefined;
  }

  /** Returns orgId or throws 400 if missing (used by services) */
  getOrgIdOrThrow(): string {
    const id = this.getOrgId();
    if (!id) {
      throw new BadRequestException('X-Org header required for this endpoint');
    }
    return id;
  }

  /** Helper for middleware to set tenant info */
  setOrg(id: string, slug?: string | null) {
    this.req.tenant = { orgId: id, orgSlug: slug ?? null };
  }
}

//
// Controller helper: inject the current orgId directly
//
export const TenantOrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const orgId = req.tenant?.orgId ?? undefined;
    if (!orgId) {
      throw new BadRequestException('X-Org header required for this endpoint');
    }
    return orgId;
  },
);

/** Optional variant: returns orgId or null (never throws) */
export const OptionalTenantOrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.tenant?.orgId ?? null;
  },
);

// ensure this file is treated as a module even with global augmentation
export { };
