import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { Org } from '../../common/org.decorator';
import { CreateProductDto, UpdateProductDto } from './dto';
import { ProductsService } from './products.service';

class AdjustInventoryDto {
  @Type(() => Number)
  @IsInt()
  delta!: number;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Org() org: { slug: string }) {
    return this.products.findAll(org.slug);
  }

  @Get(':id')
  getOne(@Org() org: { slug: string }, @Param('id') id: string) {
    return this.products.findOne(org.slug, id);
  }

  @Post()
  create(@Org() org: { slug: string }, @Body() dto: CreateProductDto) {
    return this.products.create(org.slug, dto);
  }

  @Put(':id')
  update(
    @Org() org: { slug: string },
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(org.slug, id, dto);
  }

  @Delete(':id')
  remove(@Org() org: { slug: string }, @Param('id') id: string) {
    return this.products.remove(org.slug, id);
  }

  @Get(':id/inventory')
  getInventory(@Org() org: { slug: string }, @Param('id') id: string) {
    return this.products.getInventory(org.slug, id);
  }

  @Post(':id/inventory')
  adjustInventory(
    @Org() org: { slug: string },
    @Param('id') id: string,
    @Body() payload: AdjustInventoryDto,
  ) {
    return this.products.addInventory(org.slug, id, payload.delta);
  }
}