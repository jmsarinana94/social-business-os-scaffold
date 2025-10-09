import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Lightweight guard that just normalizes the org slug from the header.
 * We don't hit Prisma here anymore; Org creation/ensuring happens in services.
 */
@Injectable()
export class OrgHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const slug = (req.headers['x-org'] as string) || 'demo';
    req.orgSlug = slug;
    return true;
  }
}