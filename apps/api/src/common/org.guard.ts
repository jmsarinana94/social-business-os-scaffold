import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';

@Injectable()
export class OrgGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const slug = req.headers['x-org'];
    if (!slug || typeof slug !== 'string') {
      throw new BadRequestException('X-Org header required');
    }
    // stash for the @Org() decorator convenience
    req.org = { slug };
    return true;
  }
}