import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class OrgHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const slug = req.header('x-org')?.trim();
    if (!slug) {
      throw new BadRequestException('x-org header required');
    }
    // stow for handlers that want it without re-reading headers
    (req as any).__orgSlug = slug;
    return true;
    }
}