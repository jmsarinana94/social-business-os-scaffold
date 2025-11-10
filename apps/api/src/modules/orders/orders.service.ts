import { Injectable, NotFoundException } from '@nestjs/common';

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
  async list(_ctx: OrgCtx): Promise<unknown[]> {
    // TODO: Implement database query scoped to org
    return [];
  }

  async getOne(_ctx: OrgCtx, id: string): Promise<unknown> {
    // TODO: Fetch order by ID with org scoping
    throw new NotFoundException(`Order ${id} not found (stub)`);
  }

  async create(_ctx: OrgCtx, _dto: CreateOrderDto): Promise<{ id: string; status: string }> {
    // TODO: Persist order to database
    return { id: 'stub', status: 'CREATED' };
  }
}