import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  createParamDecorator,
} from '@nestjs/common';

export type OrgRef = { slug: string };

@Injectable()
export class OrgGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const slug = (req.headers['x-org'] || req.headers['X-Org'] || '').toString().trim();

    if (!slug) {
      throw new BadRequestException('Missing X-Org header');
    }

    req.org = { slug } as OrgRef;
    return true;
  }
}

export const Org = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return (req.org || { slug: '' }) as OrgRef;
});