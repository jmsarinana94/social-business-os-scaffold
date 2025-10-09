import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OrgId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const orgId = request.headers['x-org-id'] as string | undefined;
  if (!orgId) {
    // Tests expect 400 with this exact failure to come from validation layer
    throw new BadRequestException('x-org-id header is required');
  }
  return orgId;
});