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
import { ProductCreateDto, ProductUpdateDto } from './dto/product.dto';
import { ProductsService } from './products.service';

function getOrgId(headers: Record<string, string | string[] | undefined>) {
  const raw = headers['x-org'];
  return (Array.isArray(raw) ? raw[0] : raw) || 'demo';
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  async list(
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string, // <-- use `q` to match the service type
    @Query('type') type?: string,
    @Query('status') status?: 'active' | 'inactive',
  ) {
    const orgId = getOrgId(headers);
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));

    const result = await this.products.list(orgId, {
      page: p,
      limit: l,
      q,
      type,
      status,
    });

    if ('meta' in result) {
      return { ok: true, ...result };
    }

    const { data, total } = result as any;
    return {
      ok: true,
      data,
      meta: { page: p, limit: l, total, pageCount: Math.ceil((total ?? 0) / l) || 0 },
    };
  }

  @Get(':id')
  async get(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const orgId = getOrgId(headers);
    const data = await this.products.get(orgId, id);
    return { ok: true, data };
  }

  @Post()
  async create(
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: ProductCreateDto,
  ) {
    const orgId = getOrgId(headers);
    const data = await this.products.create(orgId, body);
    return { ok: true, data };
  }

  @Put(':id')
  async update(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: ProductUpdateDto,
  ) {
    const orgId = getOrgId(headers);
    const data = await this.products.update(orgId, id, body);
    return { ok: true, data };
  }

  @Delete(':id')
  async remove(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const orgId = getOrgId(headers);
    const data = await this.products.remove(orgId, id);
    return { ok: true, data: { id: data.id } };
  }
}