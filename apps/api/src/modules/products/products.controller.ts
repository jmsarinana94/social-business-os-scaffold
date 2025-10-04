import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  CreateProductDto,
  UpdateProductDto,
} from './dto/products.dto';
import { ProductsService } from './products.service';

type OrgRef = { orgId?: string; orgSlug?: string };

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  private resolveOrg(req: Request, headers: Record<string, any>): OrgRef {
    // Priority: explicit headers -> JWT (req.user) -> env -> demo fallback
    const hdr = (k: string) => (headers[k] || headers[k.toLowerCase()]) as string | undefined;

    const orgId =
      hdr('x-org-id') ||
      ((req.user as any)?.orgId as string | undefined) ||
      process.env.ORG_ID ||
      undefined;

    const orgSlug =
      hdr('x-org-slug') ||
      process.env.ORG_SLUG ||
      'demo-org';

    if (!orgId && !orgSlug) {
      throw new BadRequestException(
        'Organization context required (x-org-id or x-org-slug)',
      );
    }
    return { orgId, orgSlug };
  }

  @Post()
  async create(
    @Req() req: Request,
    @Headers() headers: Record<string, any>,
    @Body() dto: CreateProductDto,
  ) {
    const org = this.resolveOrg(req, headers);
    return this.products.create(org, dto);
  }

  @Get()
  async list(
    @Req() req: Request,
    @Headers() headers: Record<string, any>,
  ) {
    const org = this.resolveOrg(req, headers);
    return this.products.list(org);
  }

  @Get(':id')
  async getOne(
    @Req() req: Request,
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
  ) {
    const org = this.resolveOrg(req, headers);
    return this.products.getOne(org, id);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const org = this.resolveOrg(req, headers);
    return this.products.update(org, id, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
  ) {
    const org = this.resolveOrg(req, headers);
    return this.products.remove(org, id);
  }
}