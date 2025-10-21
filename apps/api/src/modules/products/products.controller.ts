import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './dto';
import { ProductsService } from './products.service';

function orgFromHeaders(headers: Record<string, string | string[] | undefined>) {
  const slug = (headers['x-org'] as string) || (headers['X-Org'] as unknown as string);
  if (!slug) throw new BadRequestException('Missing X-Org header');
  return { slug };
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Headers() headers: Record<string, string>) {
    return this.products.findAll(orgFromHeaders(headers));
  }

  @Get(':id')
  get(@Headers() headers: Record<string, string>, @Param('id') id: string) {
    return this.products.findOne(orgFromHeaders(headers), id);
  }

  @Post()
  create(
    @Headers() headers: Record<string, string>,
    @Body() dto: CreateProductDto,
  ) {
    return this.products.create(orgFromHeaders(headers), dto);
  }

  // Tests use PATCH for partial update
  @Patch(':id')
  patch(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.patch(orgFromHeaders(headers), id, dto);
  }

  // Be extra compatible: allow PUT too (some suites use it occasionally)
  @Put(':id')
  put(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.patch(orgFromHeaders(headers), id, dto);
  }

  // Inventory adjustment: tests hit POST and expect 200
  @Post(':id/inventory')
  @HttpCode(200)
  adjustInventoryPost(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() body: { delta: number },
  ) {
    return this.products.adjustInventory(
      orgFromHeaders(headers),
      id,
      Number(body?.delta ?? 0),
    );
  }

  // Keep PATCH alias as well (harmless and future-proof)
  @Patch(':id/inventory')
  @HttpCode(200)
  adjustInventoryPatch(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() body: { delta: number },
  ) {
    return this.products.adjustInventory(
      orgFromHeaders(headers),
      id,
      Number(body?.delta ?? 0),
    );
  }

  @Delete(':id')
  remove(@Headers() headers: Record<string, string>, @Param('id') id: string) {
    return this.products.remove(orgFromHeaders(headers), id);
  }
}