import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Headers('x-org') org: string) {
    return this.productsService.findAll(org);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-org') org: string) {
    return this.productsService.findOne(org, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Headers('x-org') org: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(org, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(
    @Param('id') id: string,
    @Headers('x-org') org: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(org, id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-org') org: string) {
    return this.productsService.remove(org, id);
  }

  @Get(':id/inventory')
  getInventory(@Param('id') id: string, @Headers('x-org') org: string) {
    return this.productsService.getInventory(org, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/inventory')
  addInventory(
    @Param('id') id: string,
    @Headers('x-org') org: string,
    @Body() payload: any,
  ) {
    return this.productsService.addInventory(org, id, payload);
  }
}