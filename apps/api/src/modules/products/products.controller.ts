import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Org } from '../../common/org.decorator';
import { OrgGuard } from '../../common/org.guard';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateProductDto, UpdateProductDto } from './dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(OrgGuard) // X-Org header required for ALL product routes
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  async list(@Org() org: { slug: string }) {
    return this.products.findAll(org.slug);
  }

  @Get(':id')
  async getOne(@Org() org: { slug: string }, @Param('id') id: string) {
    return this.products.findOne(org.slug, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Org() org: { slug: string }, @Body() dto: CreateProductDto) {
    return this.products.create(org.slug, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Org() org: { slug: string },
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(org.slug, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200) // tests expect 200 (not 204)
  async remove(@Org() org: { slug: string }, @Param('id') id: string) {
    return this.products.remove(org.slug, id);
  }

  @Get(':id/inventory')
  async getInventory(@Org() org: { slug: string }, @Param('id') id: string) {
    return this.products.getInventory(org.slug, id);
  }

  @Post(':id/inventory')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200) // tests expect 200
  async addInventory(
    @Org() org: { slug: string },
    @Param('id') id: string,
    @Body() payload: AdjustInventoryDto,
  ) {
    return this.products.addInventory(org.slug, id, payload.delta);
  }
}