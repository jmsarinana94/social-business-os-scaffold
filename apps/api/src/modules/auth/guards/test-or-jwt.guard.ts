import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class TestOrJwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (process.env.NODE_ENV === 'test') {
      return true; // allow requests during e2e tests without a token
    }
    return super.canActivate(context) as unknown as boolean | Promise<boolean> | Observable<boolean>;
  }
}