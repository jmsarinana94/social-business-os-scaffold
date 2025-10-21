// apps/api/src/modules/products/products.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { orgFromHeaders } from '../../shared/org-from-headers';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // GET /products
  @Get()
  async findAll(@Headers() headers: Record<string, string>) {
    return this.products.findAll(orgFromHeaders(headers));
  }

  // GET /products/:id
  @Get(':id')
  async findOne(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ) {
    return this.products.findOne(orgFromHeaders(headers), id);
  }

  // POST /products
  @Post()
  async create(
    @Headers() headers: Record<string, string>,
    @Body() dto: CreateProductDto,
  ) {
    return this.products.create(orgFromHeaders(headers), dto);
  }

  // PUT /products/:id  (e2e uses PUT with partial payloads; treat as partial update)
  @Put(':id')
  async update(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(orgFromHeaders(headers), id, dto);
  }

  // PATCH /products/:id  (alias to the same partial update logic)
  @Patch(':id')
  async patch(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(orgFromHeaders(headers), id, dto);
  }

  // POST /products/:id/inventory  — e2e expects 200 OK (not 201)
  @Post(':id/inventory')
  @HttpCode(200)
  async adjustInventory(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() body: { delta?: number },
  ) {
    const delta = Number(body?.delta ?? 0);
    if (!Number.isFinite(delta)) {
      throw new BadRequestException('delta must be a number');
    }
    return this.products.adjustInventory(orgFromHeaders(headers), id, delta);
  }

  // DELETE /products/:id
  @Delete(':id')
  async remove(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ) {
    return this.products.remove(orgFromHeaders(headers), id);
  }
}