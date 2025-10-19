import { Injectable, NotFoundException } from '@nestjs/common';

interface OrgCtx {
  orgId?: string;
  id?: string;
  orgSlug?: string;
  slug?: string;
}

@Injectable()
export class OrdersService {
  async list(_ctx: OrgCtx) {
    return []; // stub
  }

  async getOne(_ctx: OrgCtx, id: string) {
    throw new NotFoundException(`Order ${id} not found (stub)`);
  }

  async create(_ctx: OrgCtx, _dto: any) {
    return { id: 'stub', status: 'CREATED' };
  }
}