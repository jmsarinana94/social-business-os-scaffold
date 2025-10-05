import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OrgHeaderGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  private isAuthRoute(req: any) {
    // Allow all auth routes (signup, login, me) to bypass org guard
    const method = (req.method || '').toUpperCase();
    const path = (req.path || req.url || '') as string;
    if (!path) return false;
    if (path.startsWith('/auth')) return true;
    // You can add other health/docs endpoints here if needed.
    return false;
  }

  canActivate(context: ExecutionContext): boolean {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    if (this.isAuthRoute(req)) {
      return true;
    }

    const orgId = req.headers['x-org-id'];
    const orgSlug = req.headers['x-org-slug'];

    // We only require one of them. Tests set x-org-id.
    if (!orgId && !orgSlug) {
      // Let controllers/services throw a clean 400 message;
      // returning false would become 403. We prefer consistency:
      throw new Error(
        'Organization context not provided (x-org-id or x-org-slug required).',
      );
    }

    return true;
  }
}