// apps/api/src/common/middleware/request-id.middleware.ts
import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id'];
    const id =
      (typeof incoming === 'string' && incoming.trim().length > 0)
        ? incoming
        : randomUUID();

    // Attach to request (typed) and echo on the response header
    req.requestId = id;
    res.setHeader('x-request-id', id);

    next();
  }
}