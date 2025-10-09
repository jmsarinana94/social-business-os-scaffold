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
  Query,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

type OrgRef = { id?: string; slug?: string };

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  private orgFromHeaders(orgHeader?: string): OrgRef {
    return orgHeader ? { slug: orgHeader } : { slug: 'demo' };
  }

  @Get()
  async list(
    @Headers('x-org') orgHeader: string | undefined,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const org = this.orgFromHeaders(orgHeader);
    return this.products.findAll(org, Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  async getOne(@Headers('x-org') orgHeader: string | undefined, @Param('id') id: string) {
    const org = this.orgFromHeaders(orgHeader);
    return this.products.findOne(org, id);
  }

  @Post()
  async create(
    @Headers('x-org') orgHeader: string | undefined,
    @Body() dto: CreateProductDto,
  ) {
    const org = this.orgFromHeaders(orgHeader);
    return this.products.create(org, dto);
  }

  @Put(':id')
  async update(
    @Headers('x-org') orgHeader: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const org = this.orgFromHeaders(orgHeader);
    return this.products.update(org, id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Headers('x-org') orgHeader: string | undefined, @Param('id') id: string) {
    const org = this.orgFromHeaders(orgHeader);
    return this.products.remove(org, id);
  }

  @Get(':id/inventory')
  async getInventory(@Headers('x-org') orgHeader: string | undefined, @Param('id') id: string) {
    const org = this.orgFromHeaders(orgHeader);
    return this.products.getInventory(org, id);
  }

  @Post(':id/inventory')
  @HttpCode(200) // tests expect 200, not 201
  async addInventory(
    @Headers('x-org') orgHeader: string | undefined,
    @Param('id') id: string,
    @Body() payload: { delta: number },
  ) {
    const org = this.orgFromHeaders(orgHeader);
    return this.products.addInventory(org, id, payload);
  }
}