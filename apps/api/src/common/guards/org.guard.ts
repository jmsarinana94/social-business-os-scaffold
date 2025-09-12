// apps/api/src/common/guards/org.guard.ts
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class OrgGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const slug = (req.headers['x-org'] as string | undefined)?.trim();

    if (!slug) {
      throw new BadRequestException('Missing x-org header');
    }

    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    req.org = { id: org.id, slug: org.slug };
    return true;
    }
}