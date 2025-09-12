// apps/api/src/modules/products/guards/unique-sku.guard.ts
import {
    CanActivate,
    ConflictException,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

type OrgInRequest =
  | { id: string; slug: string; name?: string }
  | undefined;

@Injectable()
export class UniqueSkuGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{
      body?: { sku?: string };
      org?: OrgInRequest;
    }>();

    const sku = req.body?.sku?.trim();
    if (!sku) return true; // no SKU in payload -> let DTO validation handle it

    const org = req.org;
    if (!org?.id) return true; // org middleware should enforce this; fail-open here

    const existing = await this.prisma.product.findFirst({
      where: { orgId: org.id, sku },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `SKU "${sku}" already exists in this organization.`,
      );
    }
    return true;
  }
}