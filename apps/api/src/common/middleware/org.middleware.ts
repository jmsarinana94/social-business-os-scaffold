import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrgMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const slug = (req.header('x-org') || '').trim();

    if (!slug) {
      // Let health/docs through without org header
      if (req.path.startsWith('/health') || req.path.startsWith('/docs')) {
        return next();
      }
      throw new BadRequestException('Missing x-org header');
    }

    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!org) {
      throw new BadRequestException(`Unknown organization slug: ${slug}`);
    }

    // Set on req; typed via global declaration in src/types/express.d.ts
    (req as any).orgId = org.id;
    next();
  }
}