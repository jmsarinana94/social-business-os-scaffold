import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../../infra/prisma/prisma.service';

declare global {
  namespace Express {
    interface Request {
      org?: {
        id: string;
        slug: string | null;
        name: string | null;
      };
    }
  }
}

@Injectable()
export class OrgMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const slug = req.header('x-org');
    if (!slug) throw new BadRequestException('x-org header is required');

    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true },
    });

    if (!org) throw new BadRequestException('Organization not found');

    req.org = { id: org.id, slug: org.slug ?? null, name: org.name ?? null };
    next();
  }
}