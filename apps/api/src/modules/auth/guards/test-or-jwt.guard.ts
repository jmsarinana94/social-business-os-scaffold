import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Allows all requests in test env; otherwise defers to JWT guard.
 */
@Injectable()
export class TestOrJwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    if (process.env.NODE_ENV === 'test') return true;
    return super.canActivate(context);
  }
}