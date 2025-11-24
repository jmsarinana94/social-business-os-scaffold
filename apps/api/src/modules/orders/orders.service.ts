// apps/api/src/modules/orders/orders.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { ok: true, scope: 'orders' };
  }

  async list(orgId: string) {
    return this.prisma.order.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        account: true,
        contact: true,
      },
    });
  }

  async getOne(orgId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, organizationId: orgId },
      include: {
        items: true,
        account: true,
        contact: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async create(orgId: string, dto: CreateOrderDto) {
    const { accountId, contactId, status, items } = dto;

    const totalCents = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPriceCents;
    }, 0);

    const total = totalCents / 100;

    return this.prisma.order.create({
      data: {
        organizationId: orgId,
        accountId: accountId ?? null,
        contactId: contactId ?? null,
        status: status ?? OrderStatus.PENDING,
        currency: 'USD',
        total,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents / 100,
            lineTotal: (item.quantity * item.unitPriceCents) / 100,
          })),
        },
      },
      include: {
        items: true,
        account: true,
        contact: true,
      },
    });
  }
}