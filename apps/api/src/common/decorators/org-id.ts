import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Reads org id from "x-org" header; defaults to "demo" for tests/local. */
export const OrgId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const val = (req.headers?.['x-org'] as string) || (req.headers?.['X-Org'] as string);
  return val || 'demo';
});