import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface OrgHeader {
  slug: string;
}

export const Org = createParamDecorator((_data: unknown, ctx: ExecutionContext): OrgHeader => {
  const req = ctx.switchToHttp().getRequest();
  const slug = req.headers['x-org'];
  return { slug: typeof slug === 'string' ? slug : '' };
});