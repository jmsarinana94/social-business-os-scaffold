import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CreateProductDto, OrgHeader, UpdateProductDto } from './products.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // Create a new product
  @Post()
  create(@OrgHeader() orgId: string | undefined, @Body() dto: CreateProductDto) {
    return this.products.create(orgId, dto);
  }

  // List all products for an org
  @Get()
  findAll(@OrgHeader() orgId: string | undefined) {
    return this.products.findAll(orgId);
  }

  // Get a single product by id
  @Get(':id')
  findOne(@OrgHeader() orgId: string | undefined, @Param('id') id: string) {
    return this.products.findOne(orgId, id);
  }

  // Full update (PUT)
  @Put(':id')
  replace(
    @OrgHeader() orgId: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(orgId, id, dto);
  }

  // Partial update (PATCH)
  @Patch(':id')
  patch(
    @OrgHeader() orgId: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(orgId, id, dto);
  }

  // --- INVENTORY ADJUST ROUTES ---
  // Accept delta without DTO validation; coerce to number to avoid ValidationPipe 400s.
  private coerceDelta(raw: unknown): number {
    const n = typeof raw === 'string' ? Number(raw) : (raw as number);
    if (!Number.isFinite(n)) {
      throw new BadRequestException('delta must be a number');
    }
    return n;
  }

  @Patch(':id/inventory')
  @HttpCode(200)
  adjustInventoryPatch(
    @OrgHeader() orgId: string | undefined,
    @Param('id') id: string,
    @Body('delta') rawDelta: unknown,
  ) {
    const delta = this.coerceDelta(rawDelta);
    return this.products.adjustInventory(orgId, id, delta);
  }

  @Put(':id/inventory')
  @HttpCode(200)
  adjustInventoryPut(
    @OrgHeader() orgId: string | undefined,
    @Param('id') id: string,
    @Body('delta') rawDelta: unknown,
  ) {
    const delta = this.coerceDelta(rawDelta);
    return this.products.adjustInventory(orgId, id, delta);
  }

  @Post(':id/inventory')
  @HttpCode(200)
  adjustInventoryPost(
    @OrgHeader() orgId: string | undefined,
    @Param('id') id: string,
    @Body('delta') rawDelta: unknown,
  ) {
    const delta = this.coerceDelta(rawDelta);
    return this.products.adjustInventory(orgId, id, delta);
  }

  // Delete a product
  @Delete(':id')
  remove(@OrgHeader() orgId: string | undefined, @Param('id') id: string) {
    return this.products.remove(orgId, id);
  }
}