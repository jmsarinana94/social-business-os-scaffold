import { CanActivate, ConflictException, ExecutionContext, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma.service';

@Injectable()
export class UniqueSkuGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const orgId = req.org?.id;
    const sku: string | undefined = req.body?.sku;

    if (!sku || !orgId) return true;

    const exists = await this.prisma.product.findFirst({
      where: { sku, organizationId: orgId },
      select: { id: true },
    });

    if (exists) {
      throw new ConflictException('SKU already exists for this organization');
    }
    return true;
  }
}