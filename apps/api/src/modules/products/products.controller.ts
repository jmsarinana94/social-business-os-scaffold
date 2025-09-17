import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';

type CreateBody = {
  sku?: string;
  title: string;
  description?: string | null;
  type: 'PHYSICAL' | 'DIGITAL';
  status: 'ACTIVE' | 'INACTIVE';
  price: string;
};

type UpdateBody = Partial<CreateBody>;
type AdjustBody = { delta: number };

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  async list(
    @Headers('x-org') org: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const p = Number.parseInt(page as string, 10) || 1;
    const l = Number.parseInt(limit as string, 10) || 10;
    return this.products.list(org, p, l);
  }

  @Get(':id')
  async get(
    @Headers('x-org') org: string,
    @Param('id') id: string,
  ) {
    return this.products.get(org, id);
  }

  @Post()
  async create(
    @Headers('x-org') org: string,
    @Body() body: CreateBody,
  ) {
    // Let the service normalize enums; no string re-casting here
    return this.products.create(org, body);
  }

  @Put(':id')
  async update(
    @Headers('x-org') org: string,
    @Param('id') id: string,
    @Body() body: UpdateBody,
  ) {
    // Pass through; service validates & normalizes
    return this.products.update(org, id, body);
  }

  @Delete(':id')
  async remove(
    @Headers('x-org') org: string,
    @Param('id') id: string,
  ) {
    return this.products.remove(org, id);
  }

  @Get(':id/inventory')
  async getInventory(
    @Headers('x-org') org: string,
    @Param('id') id: string,
  ) {
    return this.products.getInventory(org, id);
  }

  @Post(':id/inventory')
  async adjustInventory(
    @Headers('x-org') org: string,
    @Param('id') id: string,
    @Body() body: AdjustBody,
  ) {
    const delta = Number(body?.delta ?? 0);
    return this.products.adjustInventory(org, id, delta);
  }
}