// apps/api/src/common/decorators/org.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Org = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.org as { id: string; slug: string } | undefined;
});

export const OrgId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return (req.org?.id as string) || undefined;
});