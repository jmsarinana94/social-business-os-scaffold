import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  async list(
    @Headers('x-org') org: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(100, Number(limit) || 10));
    return this.products.findAll(org, p, l);
  }

  @Get(':id')
  async get(@Headers('x-org') org: string, @Param('id') id: string) {
    return this.products.findOne(org, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Headers('x-org') org: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.products.create(org, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(
    @Headers('x-org') org: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(org, id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Headers('x-org') org: string, @Param('id') id: string) {
    return this.products.remove(org, id);
  }

  @Get(':id/inventory')
  async getInventory(@Headers('x-org') org: string, @Param('id') id: string) {
    return this.products.getInventory(org, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/inventory')
  @HttpCode(HttpStatus.OK) // <-- return 200 instead of default 201
  async addInventory(
    @Headers('x-org') org: string,
    @Param('id') id: string,
    @Body() payload: { delta: number },
  ) {
    return this.products.addInventory(org, id, payload);
  }
}