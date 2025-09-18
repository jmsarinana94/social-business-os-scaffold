import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * No-op OrgMiddleware
 * Kept only so legacy imports compile. Org resolution is handled in controllers now.
 */
@Injectable()
export class OrgMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction) {
    next();
  }
}