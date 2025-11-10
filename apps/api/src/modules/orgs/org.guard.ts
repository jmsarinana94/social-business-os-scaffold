import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

export type OrgContext = { id: string; slug: string };

declare module 'http' {
  interface IncomingMessage {
    org?: OrgContext;
  }
}

@Injectable()
export class OrgGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const slug = (req.headers['x-org'] || req.headers['x-org-slug']) as string | undefined;
    if (!slug) {
      throw new BadRequestException('X-Org header is required');
    }
    // In a real app you’d look this up. For tests, derive a stable org id from slug.
    req.org = { slug, id: 'org_' + Buffer.from(slug).toString('hex').slice(0, 8) };
    return true;
  }
}