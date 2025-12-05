import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class OrgHeaderGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { headers: Record<string, string | undefined> }>();
    const org = req.headers['x-org'];
    if (!org) {
      throw new BadRequestException('X-Org header is required');
    }
    return true;
  }
}