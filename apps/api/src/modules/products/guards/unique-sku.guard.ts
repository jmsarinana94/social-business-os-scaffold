import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UniqueSkuGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    // Only enforce on writes
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return true;

    const orgId = String(req.headers['x-org-id'] ?? '').trim().toLowerCase();
    if (!orgId) throw new BadRequestException('Missing x-org-id');

    const sku = String(req.body?.sku ?? '').trim();
    if (!sku) return true; // not changing SKU

    const exists = await this.prisma.product.findFirst({ where: { orgId, sku } });
    if (exists) throw new BadRequestException(`SKU ${sku} already exists in org ${orgId}`);
    return true;
    }
}