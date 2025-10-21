import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestContextService } from './request-context.service';

function readOrgSlug(req: Request): string | null {
  // Match your existing convention; we also peek common variants.
  const h =
    (req.headers['x-org'] as string) ||
    (req.headers['x-organization'] as string) ||
    (req.headers['x-tenant'] as string) ||
    null;
  return h ? String(h) : null;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly ctx: RequestContextService) {}

  use(req: Request, _res: Response, next: () => void) {
    const orgSlug = readOrgSlug(req);
    // Optionally set user id here if you decode JWT earlier in a guard.
    this.ctx.run({ orgSlug }, () => next());
  }
}