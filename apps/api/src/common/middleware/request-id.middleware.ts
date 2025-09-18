import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export function RequestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = 'x-request-id';
  const id = (req.headers[header] as string) || randomUUID();
  (req as any).requestId = id;
  res.setHeader(header, id);
  next();
}