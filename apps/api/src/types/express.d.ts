// Make sure TS knows that Express.Request has `orgId`
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    orgId?: string;
    requestId?: string; // if you use RequestIdMiddleware
  }
}