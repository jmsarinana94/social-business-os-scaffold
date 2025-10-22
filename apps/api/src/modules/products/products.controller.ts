import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgGuard } from '../orgs/org.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { InventoryDeltaDto } from './dto/inventory.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
// OrgGuard first so tests that omit X-Org get 400 (not 401)
@UseGuards(OrgGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  private orgIdFromHeaders(headers: Record<string, string | string[] | undefined>) {
    const slug = (headers['x-org'] || headers['x-org-slug']) as string;
    return 'org_' + Buffer.from(slug).toString('hex').slice(0, 8);
  }

  // --- PUBLIC (no JWT) ---
  @Get()
  async findAll(@Headers() headers: any) {
    const orgId = this.orgIdFromHeaders(headers);
    return this.products.findAll(orgId);
  }

  @Get(':id')
  async findOne(@Headers() headers: any, @Param('id') id: string) {
    const orgId = this.orgIdFromHeaders(headers);
    return this.products.findOne(orgId, id);
  }

  // --- PROTECTED (JWT required) ---
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Headers() headers: any, @Body() dto: CreateProductDto) {
    const orgId = this.orgIdFromHeaders(headers);
    return this.products.create(orgId, dto); // 201
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Headers() headers: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    const orgId = this.orgIdFromHeaders(headers);
    return this.products.update(orgId, id, dto); // 200
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200) // tests expect 200 on delete
  async remove(@Headers() headers: any, @Param('id') id: string) {
    const orgId = this.orgIdFromHeaders(headers);
    await this.products.remove(orgId, id);
    return { ok: true };
  }

  @Post(':id/inventory')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200) // tests expect 200 on success
  async adjustInventory(@Headers() headers: any, @Param('id') id: string, @Body() dto: InventoryDeltaDto) {
    const orgId = this.orgIdFromHeaders(headers);
    return this.products.adjustInventory(orgId, id, dto.delta);
  }
}