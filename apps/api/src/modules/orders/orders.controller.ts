// apps/api/src/modules/orders/orders.controller.ts

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Org } from '../../common/org.decorator';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  private ctx(org: any) {
    return { orgId: org?.id ?? org?.orgId, orgSlug: org?.slug ?? org?.orgSlug };
  }

  // Health endpoint DOES NOT use @Org
  @Get('health')
  @ApiOperation({ summary: 'Health check for orders module' })
  health() {
    return { ok: true, scope: 'orders' };
  }

  @Get()
  list(@Org() org: any) {
    return this.orders.list(this.ctx(org));
  }

  @Get(':id')
  getOne(@Org() org: any, @Param('id') id: string) {
    return this.orders.getOne(this.ctx(org), id);
  }

  @Post()
  create(@Org() org: any, @Body() dto: any) {
    return this.orders.create(this.ctx(org), dto);
  }
}