// apps/api/src/modules/orders/orders.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';

interface OrgCtx {
  orgId: string;
  orgSlug?: string;
}

interface ListParams {
  offset?: number;
  limit?: number;
}

interface InMemoryOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface InMemoryOrder {
  id: string;
  orgId: string;
  status: string;
  currency: string;
  total: number;
  createdAt: Date;
  items: InMemoryOrderItem[];
}

@Injectable()
export class OrdersService {
  // Simple in-memory store to keep the shape of real data without
  // touching Prisma until the schema/client is fully wired.
  private readonly orders = new Map<string, InMemoryOrder>();

  private generateId(): string {
    return `ord_${Math.random().toString(36).slice(2, 10)}`;
  }

  async list(ctx: OrgCtx, params?: ListParams): Promise<InMemoryOrder[]> {
    const offset = params?.offset ?? 0;
    const limit = params?.limit ?? 50;

    const allForOrg = Array.from(this.orders.values()).filter(
      (o) => o.orgId === ctx.orgId,
    );

    return allForOrg.slice(offset, offset + limit);
  }

  async getOne(ctx: OrgCtx, id: string): Promise<InMemoryOrder> {
    const order = this.orders.get(id);
    if (!order || order.orgId !== ctx.orgId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async create(ctx: OrgCtx, dto: CreateOrderDto): Promise<InMemoryOrder> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Since we’re not hitting Prisma yet, we fake prices with a constant
    // value to keep the shape correct. Later, you’ll replace this with
    // product lookups + real inventory logic.
    const defaultUnitPrice = 10; // stub

    let total = 0;
    const items: InMemoryOrderItem[] = dto.items.map((item) => {
      const unitPrice = defaultUnitPrice;
      const lineTotal = unitPrice * item.quantity;
      total += lineTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

    const order: InMemoryOrder = {
      id: this.generateId(),
      orgId: ctx.orgId,
      status: 'PENDING',
      currency: 'USD',
      total,
      createdAt: new Date(),
      items,
    };

    this.orders.set(order.id, order);
    return order;
  }
}