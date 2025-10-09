import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class UniqueSkuGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const orgSlug: string = req.headers['x-org'] || 'demo';
    const { sku } = req.body || {};
    if (!sku) return true;

    const exists = await this.prisma.product.findFirst({
      where: { sku, organization: { slug: String(orgSlug) } },
      select: { id: true },
    });

    if (exists) {
      throw new BadRequestException('SKU already exists in this org');
    }
    return true;
  }
}