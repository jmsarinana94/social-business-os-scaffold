import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve an org by slug (x-org header). Throws if not found. */
  private async resolveOrgId(orgSlug?: string): Promise<string> {
    if (!orgSlug) {
      throw new BadRequestException('Missing x-org header');
    }
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) {
      throw new NotFoundException(`Organization not found: ${orgSlug}`);
    }
    return org.id;
  }

  /** GET /products — returns { data, meta } with simple pagination defaults (page=1, limit=10). */
  async findAll(orgSlug: string, page = 1, limit = 10) {
    const orgId = await this.resolveOrgId(orgSlug);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where: { orgId } }),
      this.prisma.product.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));
    return { data, meta: { page, limit, total, pages } };
  }

  /** GET /products/:id */
  async findOne(orgSlug: string, id: string) {
    const orgId = await this.resolveOrgId(orgSlug);
    const product = await this.prisma.product.findFirst({
      where: { id, orgId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /** POST /products */
  async create(orgSlug: string, dto: CreateProductDto) {
    const orgId = await this.resolveOrgId(orgSlug);

    // Ensure enum casing if DTO was widened; otherwise Prisma will throw
    const type = (dto.type as unknown as ProductType) ?? ProductType.PHYSICAL;
    const status = (dto.status as unknown as ProductStatus) ?? ProductStatus.ACTIVE;

    return this.prisma.product.create({
      data: {
        orgId,
        sku: dto.sku,
        title: dto.title,
        description: dto.description ?? null,
        type,
        status,
        price: new Prisma.Decimal(dto.price),
        inventoryQty: dto.inventoryQty ?? 0,
      },
    });
  }

  /** PUT /products/:id */
  async update(orgSlug: string, id: string, dto: UpdateProductDto) {
    const orgId = await this.resolveOrgId(orgSlug);

    // Ensure the product exists for this org
    const existing = await this.prisma.product.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Product not found');

    const data: Prisma.ProductUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.sku !== undefined) data.sku = dto.sku;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type as unknown as ProductType;
    if (dto.status !== undefined) data.status = dto.status as unknown as ProductStatus;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.inventoryQty !== undefined) data.inventoryQty = dto.inventoryQty;

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  /** DELETE /products/:id */
  async remove(orgSlug: string, id: string) {
    const orgId = await this.resolveOrgId(orgSlug);

    // Verify it belongs to the org
    const existing = await this.prisma.product.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  /** GET /products/:id/inventory — basic example returns current qty and lastPurchasedAt */
  async getInventory(orgSlug: string, id: string) {
    const orgId = await this.resolveOrgId(orgSlug);
    const product = await this.prisma.product.findFirst({
      where: { id, orgId },
      select: { id: true, inventoryQty: true, lastPurchasedAt: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /**
   * POST /products/:id/inventory
   * Example payload: { "delta": 5, "reason": "manual_adjustment" }
   * Adjusts the `inventoryQty` field and returns the updated product.
   * If you have an inventory movements table, you can insert there too.
   */
  async addInventory(orgSlug: string, id: string, payload: any) {
    const orgId = await this.resolveOrgId(orgSlug);
    const deltaRaw = payload?.delta;
    const delta = typeof deltaRaw === 'string' ? Number(deltaRaw) : deltaRaw;

    if (typeof delta !== 'number' || Number.isNaN(delta)) {
      throw new BadRequestException('delta must be a number');
    }

    // Ensure the product exists for this org
    const existing = await this.prisma.product.findFirst({
      where: { id, orgId },
      select: { id: true, inventoryQty: true },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const newQty = (existing.inventoryQty ?? 0) + delta;
    return this.prisma.product.update({
      where: { id },
      data: { inventoryQty: newQty },
    });
  }
}