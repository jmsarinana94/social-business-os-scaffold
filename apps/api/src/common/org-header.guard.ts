import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';

/**
 * Resolves the Organization from the `x-org` header.
 * If not found, it will create it (so tests don't need external seeding).
 */
@Injectable()
export class OrgHeaderGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    // Supertest/Express gives a plain object for headers, always lowercase keys
    const orgHeader = (req.headers?.['x-org'] as string | undefined)?.trim();

    if (!orgHeader) {
      throw new BadRequestException('Missing x-org header');
    }

    // Upsert by slug so first hit creates it, later hits re-use it
    const org = await this.prisma.organization.upsert({
      where: { slug: orgHeader },
      update: {},
      create: { slug: orgHeader, name: orgHeader },
      select: { id: true, slug: true, name: true },
    });

    req.orgId = org.id;
    req.org = org;
    return true;
  }
}