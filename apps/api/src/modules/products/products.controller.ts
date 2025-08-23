// apps/api/src/modules/products/products.controller.ts
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

import { ProductCreateDto, ProductQueryDto, ProductUpdateDto } from './dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  async list(
    @Headers('x-org') orgId: string,
    @Query() query: ProductQueryDto,
  ) {
    const out = await this.service.list(orgId ?? 'demo', query);

    // Normalize to { data, meta } no matter what the service returns
    const dataArray =
      (out as any).data ??
      (out as any).items ??
      (Array.isArray(out) ? out : undefined);

    const meta = (out as any).meta ?? undefined;

    return { data: dataArray ?? [], ...(meta ? { meta } : {}) };
  }

  @Get(':id')
  get(@Headers('x-org') orgId: string, @Param('id') id: string) {
    return this.service.get(orgId ?? 'demo', id);
  }

  @Post()
  create(@Headers('x-org') orgId: string, @Body() dto: ProductCreateDto) {
    return this.service.create(orgId ?? 'demo', dto);
  }

  @Put(':id')
  update(
    @Headers('x-org') orgId: string,
    @Param('id') id: string,
    @Body() dto: ProductUpdateDto,
  ) {
    return this.service.update(orgId ?? 'demo', id, dto);
  }

  @Delete(':id')
  remove(@Headers('x-org') orgId: string, @Param('id') id: string) {
    return this.service.remove(orgId ?? 'demo', id);
  }
}