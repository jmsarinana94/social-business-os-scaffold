import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class UniqueSkuGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const orgSlug: string | undefined =
      req.headers['x-org'] || req.headers['X-Org'];

    // If no SKU in body, skip
    const sku: string | undefined = req.body?.sku;
    if (!sku) return true;

    // Ensure we scope by org slug
    const existing = await this.prisma.product.findFirst({
      where: { sku, org: { slug: String(orgSlug) } },
      select: { id: true },
    });

    return !existing;
  }
}