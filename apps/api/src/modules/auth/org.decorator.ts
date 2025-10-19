import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type ResolvedOrg = { id: string; slug: string };

export const Org = createParamDecorator((_data: unknown, ctx: ExecutionContext): ResolvedOrg => {
  const req = ctx.switchToHttp().getRequest();
  if (req?.org && req.org.id && req.org.slug) return req.org;
  return {
    id: process.env.ORG_ID ?? 'cmg2xbc6g0000si2l3ah1h9rk',
    slug: process.env.ORG ?? 'org_demo',
  };
});