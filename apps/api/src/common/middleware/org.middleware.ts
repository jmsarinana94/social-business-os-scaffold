// src/common/middleware/org.middleware.ts
import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

// Augment Express.Request safely without relying on 'express-serve-static-core'
declare global {
  namespace Express {
    interface Request {
      org?: { id: string; slug: string; name: string };
    }
  }
}

@Injectable()
export class OrgMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const slug = req.header('x-org')?.trim();
    if (!slug) {
      throw new BadRequestException('Missing x-org header');
    }

    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) {
      throw new UnauthorizedException('Organization not found');
    }

    // Keep the shape in sync with the declaration above
    req.org = { id: org.id, slug: org.slug, name: org.name };
    next();
  }
}