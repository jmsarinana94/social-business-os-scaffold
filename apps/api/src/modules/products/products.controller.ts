import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TestOrJwtAuthGuard } from '../auth/guards/test-or-jwt.guard';
import {
  AdjustInventoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './products.dto';
import { OrgRef, ProductsService } from './products.service';

function orgFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): OrgRef {
  // Accept either x-org (slug) or x-org-id (UUID)
  const slug = headers['x-org'] as string | undefined;
  const id = headers['x-org-id'] as string | undefined;

  if (!slug && !id) {
    throw new BadRequestException('Missing x-org header');
  }
  return { slug, id };
}

@UseGuards(TestOrJwtAuthGuard)
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // GET /v1/products?page=&limit=
  @Get()
  async list(
    @Headers() headers: Record<string, string>,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const org = orgFromHeaders(headers);
    const p = Math.max(parseInt(String(page), 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(String(limit), 10) || 10, 1), 100);
    return this.products.findAll(org, p, l);
  }

  // GET /v1/products/:id
  @Get(':id')
  async getOne(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ) {
    const org = orgFromHeaders(headers);
    return this.products.findOne(org, id);
  }

  // POST /v1/products
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Headers() headers: Record<string, string>,
    @Body() dto: CreateProductDto,
  ) {
    const org = orgFromHeaders(headers);
    return this.products.create(org, dto);
  }

  // PUT /v1/products/:id
  @Put(':id')
  async update(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const org = orgFromHeaders(headers);
    return this.products.update(org, id, dto);
  }

  // DELETE /v1/products/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ) {
    const org = orgFromHeaders(headers);
    return this.products.remove(org, id);
  }

  // GET /v1/products/:id/inventory
  @Get(':id/inventory')
  async getInventory(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ) {
    const org = orgFromHeaders(headers);
    return this.products.getInventory(org, id);
  }

  // POST /v1/products/:id/inventory  -> should be 200 OK (not 201)
  @Post(':id/inventory')
  @HttpCode(HttpStatus.OK)
  async addInventory(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() payload: AdjustInventoryDto,
  ) {
    const org = orgFromHeaders(headers);
    return this.products.addInventory(org, id, payload);
  }
}