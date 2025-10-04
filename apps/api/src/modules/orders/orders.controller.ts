import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

type OrgHeaders = {
  'x-org-id'?: string;
  'x-org-slug'?: string;
};

@Controller('orders') // <-- IMPORTANT: no /v1 here
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Headers() headers: OrgHeaders) {
    const ctx = { orgId: headers['x-org-id'], orgSlug: headers['x-org-slug'] };
    return this.orders.list(ctx);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Headers() headers: OrgHeaders) {
    const ctx = { orgId: headers['x-org-id'], orgSlug: headers['x-org-slug'] };
    return this.orders.getOne(ctx, id);
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @Headers() headers: OrgHeaders) {
    const ctx = { orgId: headers['x-org-id'], orgSlug: headers['x-org-slug'] };
    return this.orders.create(ctx, dto);
  }
}