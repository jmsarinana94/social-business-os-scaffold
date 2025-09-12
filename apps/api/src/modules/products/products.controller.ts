import {
  BadRequestException,
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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  private requireOrg(org?: string): string {
    if (!org) throw new BadRequestException('Missing x-org header');
    return org;
  }

  @Get()
  async list(
    @Headers('x-org') org: string | undefined,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const o = this.requireOrg(org);
    return this.svc.list(o, { page: Number(page) || 1, limit: Number(limit) || 10 });
  }

  @Get(':id')
  async get(@Param('id') id: string, @Headers('x-org') org?: string) {
    const o = this.requireOrg(org);
    return this.svc.get(o, id);
  }

  @Post()
  async create(@Body() body: CreateProductDto, @Headers('x-org') org?: string) {
    const o = this.requireOrg(org);
    return this.svc.create(o, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateProductDto, @Headers('x-org') org?: string) {
    const o = this.requireOrg(org);
    return this.svc.update(o, id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('x-org') org?: string) {
    const o = this.requireOrg(org);
    return this.svc.remove(o, id);
  }
}