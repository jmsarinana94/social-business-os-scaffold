// apps/api/src/modules/orders/orders.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { OrgsService } from '../orgs/orgs.service';
import { PrismaService } from '../prisma/prisma.service';

interface OrgCtx {
  orgId?: string;
  id?: string;
  orgSlug?: string;
  slug?: string;
}

interface CreateOrderDto {
  // Expand later when implementing real order creation
  [key: string]: unknown;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgs: OrgsService,
  ) {}

  async list(_ctx: OrgCtx): Promise<unknown[]> {
    // TODO: Implement database query scoped to org
    this.logger.debug('OrdersService.list called (stub)');
    return [];
  }

  async getOne(_ctx: OrgCtx, id: string): Promise<unknown> {
    // TODO: Fetch order by ID with org scoping
    this.logger.debug(`OrdersService.getOne called for id=${id} (stub)`);
    throw new NotFoundException(`Order ${id} not found (stub)`);
  }

  async create(
    _ctx: OrgCtx,
    _dto: CreateOrderDto,
  ): Promise<{ id: string; status: string }> {
    // TODO: Persist order to database
    this.logger.debug('OrdersService.create called (stub)');
    return { id: 'stub', status: 'CREATED' };
  }
}