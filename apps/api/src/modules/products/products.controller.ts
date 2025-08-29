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

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(
    @Headers('x-org') org: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.products.list(org, Number(page), Number(limit));
  }

  @Post()
  create(@Headers('x-org') org: string, @Body() dto: CreateProductDto) {
    return this.products.create(org, dto);
  }

  @Get(':id')
  get(@Headers('x-org') org: string, @Param('id') id: string) {
    return this.products.get(org, id);
  }

  @Put(':id')
  update(
    @Headers('x-org') org: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(org, id, dto);
  }

  @Delete(':id')
  remove(@Headers('x-org') org: string, @Param('id') id: string) {
    return this.products.remove(org, id);
  }
}