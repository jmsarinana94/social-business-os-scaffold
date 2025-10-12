import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TenantContext } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const header = (req.header('x-org') || req.header('x-org-id') || '').trim();
    const orgId = header.length ? header : undefined;

    // Bind this request to the tenant context
    TenantContext.runWithOrg(orgId, () => next());
  }
}