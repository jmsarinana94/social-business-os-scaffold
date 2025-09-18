import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Usage: @Roles('ADMIN') or @Roles('OWNER', 'ADMIN')
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    // You likely set these earlier in an auth guard/middleware
    const member = req.member as { role?: string } | undefined;

    const role = (member?.role ?? 'MEMBER').toUpperCase();
    if (!required.map(r => r.toUpperCase()).includes(role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}