import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Returns the org string saved by OrgHeaderGuard on req.orgId.
 * Falls back to req.org?.id if some middleware set a richer object.
 */
export const Org = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx
    .switchToHttp()
    .getRequest<Request & { orgId?: string; org?: any }>();

  if (typeof req.orgId === 'string' && req.orgId) return req.orgId;

  const maybeObj = req.org;
  if (maybeObj && typeof maybeObj === 'object' && typeof maybeObj.id === 'string') {
    return maybeObj.id;
  }

  return undefined;
});