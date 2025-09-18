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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';

// DTOs — keep these import paths as they are in your repo
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// Types the service expects
type OrgRef =
  | { slug: string; id?: never }
  | { orgId: string; slug?: never };

@Controller({
  path: 'products',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /** Accept either x-org (slug) or x-org-id (uuid). Case-insensitive, trims empties. */
  private resolveOrgFromHeaders(headers: Record<string, any>): OrgRef {
    // Express lower-cases header keys; still be defensive
    const rawSlug =
      headers['x-org'] ??
      headers['X-Org'] ??
      headers['x-org'.toLowerCase()];
    const rawOrgId =
      headers['x-org-id'] ??
      headers['X-Org-Id'] ??
      headers['x-org-id'.toLowerCase()];

    const slug = typeof rawSlug === 'string' ? rawSlug.trim() : '';
    const orgId = typeof rawOrgId === 'string' ? rawOrgId.trim() : '';

    if (slug) return { slug };
    if (orgId) return { orgId };

    // This is the exact error your script is seeing — now only thrown if *both* are truly absent
    throw new BadRequestException('Missing x-org header');
  }

  @Get()
  async findAll(
    @Headers() headers: Record<string, any>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const org = this.resolveOrgFromHeaders(headers);
    const p = Math.max(parseInt(page ?? '1', 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit ?? '10', 10) || 10, 1), 100);
    return this.products.findAll(org, p, l);
  }

  @Get(':id')
  async findOne(
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
  ) {
    const org = this.resolveOrgFromHeaders(headers);
    return this.products.findOne(org, id);
  }

  @Post()
  async create(
    @Headers() headers: Record<string, any>,
    @Body() dto: CreateProductDto,
  ) {
    const org = this.resolveOrgFromHeaders(headers);
    return this.products.create(org, dto);
  }

  @Put(':id')
  async update(
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const org = this.resolveOrgFromHeaders(headers);
    return this.products.update(org, id, dto);
  }

  @Delete(':id')
  async remove(
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
  ) {
    const org = this.resolveOrgFromHeaders(headers);
    return this.products.remove(org, id);
  }

  @Get(':id/inventory')
  async getInventory(
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
  ) {
    const org = this.resolveOrgFromHeaders(headers);
    return this.products.getInventory(org, id);
  }

  @Post(':id/inventory')
  async addInventory(
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
    @Body() payload: AdjustInventoryDto,
  ) {
    const org = this.resolveOrgFromHeaders(headers);
    return this.products.addInventory(org, id, payload);
  }
}