// apps/api/src/modules/orders/orders.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Simple health check used by e2e + CI.
   */
  health() {
    return { ok: true, scope: 'orders' };
  }

  /**
   * List all orders for a given org.
   */
  list(organizationId: string) {
    return this.prisma.order.findMany({
      where: { organizationId },
      include: {
        items: true, // matches `items OrderItem[]` in schema
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single order by id scoped to org.
   */
  async getOne(organizationId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, organizationId },
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
   * Create an order (scoped to org) with items.
   *
   * v1 behavior:
   * - Pulls product prices from DB
   * - Computes lineTotal + total
   * - DOES NOT yet touch inventory (we can add that later).
   */
  async create(organizationId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    const productIds = dto.items.map((item) => item.productId);

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        organizationId,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found for this organization');
    }

    // Build order items with pricing based on Product.price (Decimal)
    const itemsData = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product not found: ${item.productId}`);
      }

      const unitPriceNumber =
        product.price instanceof Prisma.Decimal
          ? product.price.toNumber()
          : Number(product.price);

      const lineTotalNumber = unitPriceNumber * item.quantity;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(unitPriceNumber),
        lineTotal: new Prisma.Decimal(lineTotalNumber),
      };
    });

    const totalNumber = itemsData.reduce(
      (sum, item) => sum + item.lineTotal.toNumber(),
      0,
    );

    // For v1 we just hard-code USD; CreateOrderDto doesn't carry currency yet
    const currency = 'USD';

    const created = await this.prisma.order.create({
      data: {
        organizationId,
        accountId: dto.accountId ?? null,
        contactId: dto.contactId ?? null,
        status: OrderStatus.PENDING, // enum: DRAFT | PENDING | PAID | CANCELED
        currency,
        total: new Prisma.Decimal(totalNumber),
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return created;
  }

  /**
   * Update order status (scoped to org).
   */
  async updateStatus(
    organizationId: string,
    id: string,
    dto: UpdateOrderStatusDto,
  ) {
    // Ensure the order exists and belongs to the org
    const existing = await this.prisma.order.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    // DTO type is a wrapper (OrderStatusDto) so we cast it into the Prisma enum type
    const nextStatus = dto.status as unknown as OrderStatus;

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: nextStatus,
      },
      include: {
        items: true,
      },
    });

    return updated;
  }
}