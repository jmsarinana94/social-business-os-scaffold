import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

type OrgCtx = { orgId?: string; orgSlug?: string };

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  async list(ctx: OrgCtx) {
    const orgId = await this.resolveOrgId(ctx);

    return this.prisma.order.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async getOne(ctx: OrgCtx, id: string) {
    const orgId = await this.resolveOrgId(ctx);

    const order = await this.prisma.order.findFirst({
      where: { id, orgId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException(`Order not found: ${id}`);
    return order;
  }

  async create(ctx: OrgCtx, dto: CreateOrderDto) {
    const orgId = await this.resolveOrgId(ctx);

    if (!dto?.items?.length) {
      throw new BadRequestException('Order must include at least one item.');
    }

    // Normalize + validate request items (DTO uses "quantity", DB uses "qty")
    const items = dto.items.map((it, idx) => {
      const productId = (it.productId ?? '').trim();
      const quantity = Number(it.quantity ?? 0);
      const unitPrice = Number(it.unitPrice ?? NaN);

      if (!productId) {
        throw new BadRequestException(`items.${idx}.productId is required`);
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(`items.${idx}.quantity must be > 0`);
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new BadRequestException(`items.${idx}.unitPrice must be >= 0`);
      }

      return { productId, quantity, unitPrice };
    });

    // Pre-calc order totals required by schema
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPriceNum = items.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0,
    );
    const totalPrice = new Prisma.Decimal(totalPriceNum);

    // Fetch referenced products and validate org alignment
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, orgId: true, inventoryQty: true },
    });

    const byId = new Map(products.map((p) => [p.id, p]));
    const missing: string[] = [];
    const wrongOrg: Array<{ id: string; sku: string; actualOrgId: string }> = [];

    for (const id of productIds) {
      const p = byId.get(id);
      if (!p) {
        missing.push(id);
        continue;
      }
      if (p.orgId !== orgId) {
        wrongOrg.push({ id: p.id, sku: p.sku, actualOrgId: p.orgId });
      }
    }

    if (missing.length) {
      throw new BadRequestException(
        `Unknown product(s) for this org: ${missing.join(', ')}`,
      );
    }
    if (wrongOrg.length) {
      const msg = wrongOrg
        .map((w) => `${w.id} (sku=${w.sku}, actualOrg=${w.actualOrgId})`)
        .join('; ');
      throw new BadRequestException(
        `Product(s) do not belong to this org: ${msg}`,
      );
    }

    // Optional inventory pre-check
    for (const i of items) {
      const p = byId.get(i.productId)!;
      if (typeof p.inventoryQty === 'number' && p.inventoryQty < i.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for product ${p.id} (sku=${p.sku})`,
        );
      }
    }

    // Transaction: create order w/ required totals, items, and adjust inventory
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.create({
        data: {
          orgId,
          totalQty,
          totalPrice,
        },
      });

      await tx.orderItem.createMany({
        data: items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          qty: item.quantity, // DB column is "qty"
          unitPrice: new Prisma.Decimal(item.unitPrice),
        })),
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventoryQty: { decrement: item.quantity },
            lastPurchasedAt: new Date(),
          },
        });
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
    });
  }

  // --------------------------------------------------------------------------
  // Internals
  // --------------------------------------------------------------------------

  /**
   * Resolve organization ID from x-org-id or x-org-slug.
   * Throws a clear error if neither is provided / resolvable.
   */
  private async resolveOrgId(ctx: OrgCtx): Promise<string> {
    const { orgId, orgSlug } = ctx || {};

    if (orgId) return orgId;

    if (orgSlug) {
      const org = await this.prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { id: true },
      });
      if (org?.id) return org.id;
    }

    throw new InternalServerErrorException(
      'Organization context not provided (x-org-id/x-org-slug missing and user has no org).',
    );
    // Prefer 400 instead? swap to:
    // throw new BadRequestException('Missing organization context: provide x-org-id or x-org-slug');
  }
}