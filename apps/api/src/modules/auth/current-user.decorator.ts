import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Usage:
 *   @CurrentUser() user: any
 *   @CurrentUser('sub') userId: string
 */
export const CurrentUser = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req?.user;
    return key ? user?.[key] : user;
  },
);