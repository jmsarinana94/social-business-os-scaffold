import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * Resolves org id from header `x-org` (or defaults to 'demo' in dev),
 * and attaches it to req.orgId for downstream decorators & handlers.
 */
@Injectable()
export class OrgGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { orgId?: string }>();
    const raw = (req.headers['x-org'] as string | undefined)?.trim();

    // TODO: replace this with real tenant resolution (JWT, session, etc.)
    req.orgId = raw && raw.length > 0 ? raw : 'demo';
    return true;
  }
}