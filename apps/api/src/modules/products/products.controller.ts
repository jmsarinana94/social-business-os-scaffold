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
  UseGuards,
} from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateProductDto } from '../../products/dto/create-product.dto';
import { UpdateProductDto } from '../../products/dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  async create(
    @Headers('x-org') orgId: string,
    @Body() dto: CreateProductDto,
  ) {
    const data = await this.products.create(orgId, dto);
    return { ok: true, data };
  }

  @Get()
  async list(
    @Headers('x-org') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('type') type?: $Enums.ProductType,
    @Query('status') status?: $Enums.ProductStatus,
  ) {
    return this.products.findAll(orgId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q,
      type,
      status,
    });
  }

  @Get(':id')
  async get(@Headers('x-org') orgId: string, @Param('id') id: string) {
    const data = await this.products.findOne(orgId, id);
    return { ok: true, data };
  }

  @Put(':id')
  async update(
    @Headers('x-org') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const data = await this.products.update(orgId, id, dto);
    return { ok: true, data };
  }

  @Delete(':id')
  async remove(@Headers('x-org') orgId: string, @Param('id') id: string) {
    const data = await this.products.remove(orgId, id);
    return { ok: true, data };
  }
}