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
} from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { ProductsService } from './products.service';

const ORG_HEADER = 'x-org';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  private orgFromHeaders(h: Record<string, any>): string {
    const v = (h?.[ORG_HEADER] ?? h?.[ORG_HEADER.toUpperCase()] ?? 'org') as string;
    return v || 'org';
  }

  @Post()
  async create(@Headers() headers: Record<string, any>, @Body() dto: CreateProductDto) {
    const org = this.orgFromHeaders(headers);
    const created = await this.products.create(org, dto);
    return created;
  }

  @Get()
  async list(@Headers() headers: Record<string, any>) {
    const org = this.orgFromHeaders(headers);
    return this.products.list(org);
  }

  @Get(':id')
  async get(@Headers() headers: Record<string, any>, @Param('id') id: string) {
    const org = this.orgFromHeaders(headers);
    return this.products.get(org, id);
  }

  @Put(':id')
  async update(
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const org = this.orgFromHeaders(headers);
    return this.products.update(org, id, dto);
  }

  // ✅ Make this 200 OK (not 201)
  @Post(':id/inventory')
  @HttpCode(200)
  async adjustInventory(
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
    @Body() body: { delta: number },
  ) {
    const org = this.orgFromHeaders(headers);
    return this.products.adjustInventory(org, id, Number(body?.delta));
  }

  // ✅ Tests expect 200 on delete
  @Delete(':id')
  @HttpCode(200)
  async remove(@Headers() headers: Record<string, any>, @Param('id') id: string) {
    const org = this.orgFromHeaders(headers);
    await this.products.remove(org, id);
    return { ok: true };
  }
}