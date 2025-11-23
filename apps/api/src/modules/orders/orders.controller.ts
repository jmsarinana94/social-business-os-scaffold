// apps/api/src/modules/orders/orders.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Org } from '../../common/org.decorator';
import { CreateOrderDto, ListOrdersQueryDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  private ctx(org: any) {
    const orgId = org?.id ?? org?.orgId;
    if (!orgId) {
      throw new BadRequestException('Org context missing (Org decorator expected orgId)');
    }

    return {
      orgId,
      orgSlug: org?.slug ?? org?.orgSlug,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for Orders module' })
  health() {
    return { ok: true, scope: 'orders' };
  }

  @Get()
  @ApiOperation({ summary: 'List orders for current org' })
  list(@Org() org: any, @Query() query: ListOrdersQueryDto) {
    return this.orders.list(this.ctx(org), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order by id' })
  getOne(@Org() org: any, @Param('id') id: string) {
    return this.orders.getOne(this.ctx(org), id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order for the current org' })
  create(@Org() org: any, @Body() dto: CreateOrderDto) {
    return this.orders.create(this.ctx(org), dto);
  }
}