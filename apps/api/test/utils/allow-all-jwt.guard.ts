// apps/api/test/utils/allow-all-jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AllowAllJwtGuard implements CanActivate {
  canActivate(_ctx: ExecutionContext): boolean {
    // Always allow: this bypasses real JWT auth for e2e convenience
    return true;
  }
}