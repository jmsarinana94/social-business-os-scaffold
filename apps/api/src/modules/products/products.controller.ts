import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateProductDto, UpdateProductDto } from './dto/products.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /**
   * Helper: resolve an orgId from headers or the current user.
   * Order of precedence:
   *   1) x-org-id
   *   2) x-org-slug
   *   3) req.user.orgId (from JWT)
   */
  private async resolveOrgId(
    headers: Record<string, string | string[] | undefined>,
    req: Request,
  ): Promise<string> {
    const orgId = (headers['x-org-id'] as string) || '';
    const orgSlug = (headers['x-org-slug'] as string) || '';

    if (orgId) return orgId;

    if (orgSlug) {
      const org = await this.products.findOrgBySlug(orgSlug);
      if (!org) throw new Error(`Organization with slug "${orgSlug}" not found`);
      return org.id;
    }

    // fall back to JWT user
    const user = req.user as { sub: string; email: string; orgId?: string } | undefined;
    if (user?.orgId) return user.orgId;

    // If your JWT doesn't include orgId, resolve via DB:
    if (user?.sub) {
      const u = await this.products.findUserById(user.sub);
      if (u?.orgId) return u.orgId;
    }

    throw new Error('Organization context not provided (x-org-id/x-org-slug missing and user has no org).');
  }

  // Small helper endpoint for debugging org resolution
  @Get('_org')
  async getOrgForToken(
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const orgId = await this.resolveOrgId(headers, req);
    return { orgId };
  }

  @Get()
  async list(
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const orgId = await this.resolveOrgId(headers, req);
    return this.products.list(orgId);
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const orgId = await this.resolveOrgId(headers, req);
    return this.products.getById(orgId, id);
  }

  @Post()
  async create(
    @Body() dto: CreateProductDto,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const orgId = await this.resolveOrgId(headers, req);
    return this.products.create(orgId, dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const orgId = await this.resolveOrgId(headers, req);
    return this.products.update(orgId, id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const orgId = await this.resolveOrgId(headers, req);
    return this.products.remove(orgId, id);
  }
}