import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Headers('x-org') orgId: string, @Body() dto: CreateProductDto) {
    const data = await this.products.create(orgId || 'demo', dto);
    return { ok: true, data: { id: data.id } };
    // (We keep it minimal per earlier outputs)
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Headers('x-org') orgId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string,
    @Query('type') type?: 'physical' | 'digital',
    @Query('status') status?: 'active' | 'inactive',
  ) {
    const result = await this.products.findAll(orgId || 'demo', {
      page: Number(page),
      limit: Number(limit),
      q,
      type,
      status,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Headers('x-org') orgId: string, @Param('id') id: string) {
    const data = await this.products.get(orgId || 'demo', id);
    return { ok: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Headers('x-org') orgId: string, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    const out = await this.products.update(orgId || 'demo', id, dto);
    return { ok: true, data: { id: out.id } };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Headers('x-org') orgId: string, @Param('id') id: string) {
    await this.products.remove(orgId || 'demo', id);
    return { ok: true };
  }
}