import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RequireOrgHeaderGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const org = req.headers['x-org'] || req.headers['x-organization'] || req.headers['x-org-id'];
    if (!org) throw new BadRequestException('Missing X-Org header');
    return true;
  }
}