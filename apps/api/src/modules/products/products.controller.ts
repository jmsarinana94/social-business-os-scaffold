import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    NotFoundException,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';

type CreateBody = {
  title: string;
  description?: string;
  price?: number;
  type?: 'physical' | 'digital';
  status?: 'active' | 'inactive';
  sku?: string; // NEW: allow caller to send a SKU (optional)
};

type UpdateBody = Partial<CreateBody>;

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  async list(
    @Headers('x-org') org: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    if (!org) throw new BadRequestException('Missing x-org header');
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return this.products.list(org, p, l);
  }

  @Post()
  async create(@Headers('x-org') org: string, @Body() body: CreateBody) {
    if (!org) throw new BadRequestException('Missing x-org header');
    if (!body?.title) throw new BadRequestException('title is required');
    return this.products.create(org, body);
  }

  @Get(':id')
  async get(@Headers('x-org') org: string, @Param('id') id: string) {
    if (!org) throw new BadRequestException('Missing x-org header');
    const product = await this.products.findById(org, id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  @Put(':id')
  async update(
    @Headers('x-org') org: string,
    @Param('id') id: string,
    @Body() body: UpdateBody,
  ) {
    if (!org) throw new BadRequestException('Missing x-org header');
    const updated = await this.products.update(org, id, body);
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  @Delete(':id')
  async remove(@Headers('x-org') org: string, @Param('id') id: string) {
    if (!org) throw new BadRequestException('Missing x-org header');
    const deleted = await this.products.remove(org, id);
    if (!deleted) throw new NotFoundException('Product not found');
    return deleted;
  }
}