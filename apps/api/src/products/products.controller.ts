import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UniqueSkuGuard } from '../modules/products/guards/unique-sku.guard';
import { ProductsService } from './products.service';

type CreateProductBody = {
  title: string;
  sku: string;
  description?: string | null;
  type: 'PHYSICAL' | 'DIGITAL' | string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  price: number;
  inventoryQty?: number;
};

type UpdateProductBody = Partial<CreateProductBody>;

type AdjustInventoryBody = { delta: number };

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /products?page=&limit=
  @Get()
  list(
    @Headers('x-org') org: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 10;
    return this.productsService.listByOrgSlug(org || 'demo', p, l);
  }

  // GET /products/:id
  @Get(':id')
  getOne(@Param('id') id: string, @Headers('x-org') org: string) {
    return this.productsService.getOne(org || 'demo', id);
  }

  // POST /products
  @Post()
  @UseGuards(UniqueSkuGuard)
  create(@Headers('x-org') org: string, @Body() body: CreateProductBody) {
    return this.productsService.create(org || 'demo', body as any);
  }

  // PUT /products/:id  (tests do partial PUT; we allow partial)
  @Put(':id')
  updatePut(
    @Param('id') id: string,
    @Headers('x-org') org: string,
    @Body() body: UpdateProductBody,
  ) {
    return this.productsService.update(org || 'demo', id, body as any);
  }

  // PATCH /products/:id (handy for manual testing)
  @Patch(':id')
  updatePatch(
    @Param('id') id: string,
    @Headers('x-org') org: string,
    @Body() body: UpdateProductBody,
  ) {
    return this.productsService.update(org || 'demo', id, body as any);
  }

  // DELETE /products/:id
  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-org') org: string) {
    return this.productsService.remove(org || 'demo', id);
  }

  // GET /products/:id/inventory
  @Get(':id/inventory')
  async getInventory(@Param('id') id: string, @Headers('x-org') org: string) {
    const product = await this.productsService.getOne(org || 'demo', id);
    return { id: product.id, inventoryQty: product.inventoryQty ?? 0 };
  }

  // POST /products/:id/inventory/adjust  { delta: number }
  @Post(':id/inventory/adjust')
  adjustInventory(
    @Param('id') id: string,
    @Headers('x-org') org: string,
    @Body() body: AdjustInventoryBody,
  ) {
    const delta = Number(body?.delta ?? 0);
    return this.productsService.adjustInventory(org || 'demo', id, delta);
  }
}