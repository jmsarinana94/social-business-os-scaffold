import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Org = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest();
  const raw = req.headers['x-org'] ?? req.header?.('x-org');
  const org = typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : '';

  if (!org) {
    throw new BadRequestException('Missing x-org header');
  }
  return org;
});