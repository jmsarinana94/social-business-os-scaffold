// apps/api/src/common/tenant.context.ts

import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  Inject,
  Injectable,
  Scope,
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
// Request-scoped accessor used across services
//
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly req: Request) {}

  /** Returns orgId if present, otherwise undefined */
  getOrgId(): string | undefined {
    return this.req.tenant?.orgId ?? this.req.orgId ?? undefined;
  }

  /** Returns orgSlug if present, otherwise undefined */
  getOrgSlug(): string | undefined {
    return this.req.tenant?.orgSlug ?? this.req.orgSlug ?? undefined;
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
  setTenant(orgId: string, orgSlug?: string | null): void {
    const normalizedSlug = orgSlug ?? undefined;
    this.req.tenant = { orgId, orgSlug: orgSlug ?? null };
    this.req.orgId = orgId;
    this.req.orgSlug = normalizedSlug;
  }

  /** Returns the entire tenant info object */
  getTenant(): TenantInfo | null {
    return (
      this.req.tenant ?? {
        orgId: this.req.orgId,
        orgSlug: this.req.orgSlug ?? null,
      }
    );
  }
}

//
// Controller helpers: param decorators for easy injection
//

/** Enforces that a valid orgId is present */
export const TenantOrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const orgId = req.tenant?.orgId ?? req.orgId;
    if (!orgId) {
      throw new BadRequestException('X-Org header required for this endpoint');
    }
    return orgId;
  },
);

/** Optional variant that safely returns orgId or null */
export const OptionalTenantOrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.tenant?.orgId ?? req.orgId ?? null;
  },
);