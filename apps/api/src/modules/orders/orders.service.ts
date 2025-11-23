import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async health() {
    return { ok: true, scope: 'orders' };
  }

  /**
   * Basic list endpoint — currently just filters by organizationId
   * and returns most recent orders first.
   */
  async list(orgId: string, _query?: unknown) {
    return this.prisma.order.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });
  }

  /**
   * Fetch a single order by id scoped to org.
   */
  async getOne(orgId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, organizationId: orgId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Create a simple order with line items.
   * - Accepts prices in cents in the DTO
   * - Stores Decimal amounts in the DB
   */
  async create(orgId: string, dto: CreateOrderDto) {
    const itemsData =
      dto.items?.map((item) => {
        const unitPrice = new Prisma.Decimal(item.unitPriceCents).div(100);
        const lineTotal = unitPrice.mul(item.quantity);

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        };
      }) ?? [];

    const total = itemsData.reduce(
      (acc, item) => acc.add(item.lineTotal),
      new Prisma.Decimal(0),
    );

    return this.prisma.order.create({
      data: {
        organizationId: orgId,
        currency: dto.currency ?? 'USD',
        status: OrderStatus.PENDING,
        total,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });
  }
}