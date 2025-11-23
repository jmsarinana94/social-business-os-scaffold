import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('health')
  health() {
    return this.orders.health();
  }

  private getOrgIdOrThrow(orgHeader?: string): string {
    if (!orgHeader) {
      throw new BadRequestException('X-Org header is required');
    }

    return orgHeader;
  }

  @Get()
  list(@Headers('x-org') orgIdHeader: string) {
    const orgId = this.getOrgIdOrThrow(orgIdHeader);
    return this.orders.list(orgId);
  }

  @Get(':id')
  getOne(
    @Headers('x-org') orgIdHeader: string,
    @Param('id') id: string,
  ) {
    const orgId = this.getOrgIdOrThrow(orgIdHeader);
    return this.orders.getOne(orgId, id);
  }

  @Post()
  create(
    @Headers('x-org') orgIdHeader: string,
    @Body() dto: CreateOrderDto,
  ) {
    const orgId = this.getOrgIdOrThrow(orgIdHeader);
    return this.orders.create(orgId, dto);
  }
}