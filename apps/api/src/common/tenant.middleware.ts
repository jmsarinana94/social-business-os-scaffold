import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from './prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const slug = (req.header('x-org') || req.header('X-Org') || '').trim();
    if (slug) {
      const org = await this.prisma.organization.findUnique({ where: { slug } });
      if (org) {
        // @ts-ignore - augmented in tenant.context.ts
        req.tenant = { orgId: org.id, orgSlug: slug };
      }
    }
    next();
  }
}