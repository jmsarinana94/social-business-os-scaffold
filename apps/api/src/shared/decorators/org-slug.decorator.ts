import {
    BadRequestException,
    createParamDecorator,
    ExecutionContext,
} from '@nestjs/common';

export const OrgSlug = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    const headerValue =
      request.headers['x-org'] ??
      request.headers['X-Org'] ??
      request.headers['x-org'.toLowerCase()];

    if (!headerValue || typeof headerValue !== 'string') {
      throw new BadRequestException('X-Org header is required');
    }

    return headerValue;
  },
);