import {
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
import { CreateProductDto, PatchProductDto, ProductsService } from './products.service';

function orgFromHeaders(h: Record<string, string>) {
  // Node lowercases header keys; still check a couple variants for safety
  return h['x-org'] || (h as any)['X-Org'] || h['x-org-id'] || (h as any)['X-Org-Id'];
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(@Headers() headers: Record<string, string>) {
    return this.products.findAll(orgFromHeaders(headers));
  }

  @Get(':id')
  findOne(@Headers() headers: Record<string, string>, @Param('id') id: string) {
    return this.products.findOne(orgFromHeaders(headers), id);
  }

  @Post()
  create(@Headers() headers: Record<string, string>, @Body() dto: CreateProductDto) {
    return this.products.create(orgFromHeaders(headers), dto);
  }

  // Tests call PUT ... provide a PUT alias that delegates to patch()
  @Put(':id')
  put(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: PatchProductDto,
  ) {
    return this.products.patch(orgFromHeaders(headers), id, dto);
  }

  @Patch(':id')
  patch(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: PatchProductDto,
  ) {
    return this.products.patch(orgFromHeaders(headers), id, dto);
  }

  @Post(':id/inventory')
  @HttpCode(200) // tests expect 200 instead of Nest's default 201
  adjustInventory(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() body: { delta: number },
  ) {
    return this.products.adjustInventory(orgFromHeaders(headers), id, Number(body?.delta ?? 0));
  }

  @Delete(':id')
  remove(@Headers() headers: Record<string, string>, @Param('id') id: string) {
    return this.products.remove(orgFromHeaders(headers), id);
  }
}