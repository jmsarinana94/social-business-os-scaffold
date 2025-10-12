// apps/api/src/modules/products/products.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Helpers ----------

  private async getOrgBySlugOrThrow(orgSlug: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException('Org not found');
    return org;
  }

  private async getProductOrThrow(orgId: string, id: string) {
    const prod = await this.prisma.product.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!prod) throw new NotFoundException('Product not found');
    return prod;
  }

  private async ensureCategoryInOrg(orgId: string, categoryId: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, organizationId: orgId },
    });
    if (!cat) throw new BadRequestException('Category does not belong to this org');
    return cat;
  }

  // ---------- Queries ----------

  async findAll(orgSlug: string) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);
    return this.prisma.product.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgSlug: string, id: string) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);
    const prod = await this.prisma.product.findFirst({
      where: { id, organizationId: org.id },
    });
    if (!prod) throw new NotFoundException('Product not found');
    return prod;
  }

  // ---------- Mutations ----------

  async create(orgSlug: string, dto: CreateProductDto) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);

    // Optional: if categoryId provided, validate it belongs to org
    if (dto.categoryId) {
      await this.ensureCategoryInOrg(org.id, dto.categoryId);
    }

    return this.prisma.product.create({
      data: {
        organizationId: org.id,
        categoryId: dto.categoryId ?? null,
        title: dto.title,
        sku: dto.sku,
        description: dto.description ?? null,
        type: dto.type,
        status: dto.status,
        // Prisma Decimal accepts number | string | Decimal
        price: dto.price as any,
        // inventory fields defaulted by schema
      },
    });
  }

  async update(orgSlug: string, id: string, dto: UpdateProductDto) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);
    await this.getProductOrThrow(org.id, id);

    // If categoryId is explicitly present:
    // - string => validate belongs to org and set it
    // - null   => clear the category
    // - undefined => leave unchanged
    if (dto.categoryId !== undefined && dto.categoryId !== null) {
      await this.ensureCategoryInOrg(org.id, dto.categoryId);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        sku: dto.sku ?? undefined,
        description: dto.description ?? undefined,
        type: dto.type ?? undefined,
        status: dto.status ?? undefined,
        price: dto.price ?? undefined,
        categoryId:
          dto.categoryId === undefined
            ? undefined // no change
            : dto.categoryId, // string or null (clear)
      },
    });
  }

  async remove(orgSlug: string, id: string) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);
    await this.getProductOrThrow(org.id, id);
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- Inventory ----------

  async getInventory(orgSlug: string, id: string) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);
    const prod = await this.prisma.product.findFirst({
      where: { id, organizationId: org.id },
      select: { id: true, inventoryQty: true },
    });
    if (!prod) throw new NotFoundException('Product not found');
    return { productId: prod.id, inventoryQty: prod.inventoryQty };
  }

  async addInventory(orgSlug: string, id: string, delta: number) {
    if (!Number.isFinite(delta) || Math.trunc(delta) !== delta) {
      throw new BadRequestException('delta must be an integer');
    }

    const org = await this.getOrgBySlugOrThrow(orgSlug);
    const prod = await this.getProductOrThrow(org.id, id);

    const nextQty = prod.inventoryQty + delta;
    if (nextQty < 0) {
      throw new BadRequestException('Inventory cannot go below zero');
    }

    const updated = await this.prisma.product.update({
      where: { id: prod.id },
      data: { inventoryQty: nextQty },
      select: { id: true, inventoryQty: true },
    });

    return { productId: updated.id, inventoryQty: updated.inventoryQty };
  }
}