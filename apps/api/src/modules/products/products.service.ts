import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// If you already have a dedicated PrismaService, replace `new PrismaClient()` with that service.
type ProductUpdateData = Prisma.ProductUpdateArgs['data'];
const data: ProductUpdateData = {};

function genSku() {
  return `SKU-${Math.random().toString(16).slice(2, 10)}`;
}

@Injectable()
export class ProductsService {
  private toEnum(v?: string) {
    return typeof v === 'string' ? v.toLowerCase().trim() : v;
  }

  private async getOrCreateOrgBySlug(slug: string) {
    if (!slug || typeof slug !== 'string') {
      throw new Error('Missing x-org header');
    }
    return prisma.organization.upsert({
      where: { slug },
      update: {},
      create: { name: slug, slug },
    });
  }

  async list(orgSlug: string, page = 1, limit = 10) {
    const org = await this.getOrCreateOrgBySlug(orgSlug);
    const skip = Math.max(0, (page - 1) * limit);

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: { orgId: org.id } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async get(orgSlug: string, id: string) {
    const org = await this.getOrCreateOrgBySlug(orgSlug);
    const product = await prisma.product.findFirst({
      where: { id, orgId: org.id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(orgSlug: string, dto: CreateProductDto) {
    const org = await this.getOrCreateOrgBySlug(orgSlug);

    const sku = (dto.sku ?? genSku()).trim();

    // Prisma Decimal column accepts string or Prisma.Decimal
    const priceStr = String(dto.price);

    return prisma.product.create({
      data: {
        orgId: org.id,
        title: dto.title,
        description: dto.description,
        price: priceStr,
        type: this.toEnum(dto.type)!,
        status: this.toEnum(dto.status)!,
        sku,
      },
    });
  }

  async update(orgSlug: string, id: string, dto: UpdateProductDto) {
    const org = await this.getOrCreateOrgBySlug(orgSlug);

    // ensure exists + belongs to org
    const existing = await prisma.product.findFirst({
      where: { id, orgId: org.id },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const data: Prisma.ProductUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = this.toEnum(dto.type)!;
    if (dto.status !== undefined) data.status = this.toEnum(dto.status)!;
    if (dto.price !== undefined) data.price = String(dto.price);
    if (dto.sku !== undefined) data.sku = dto.sku.trim();

    return prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(orgSlug: string, id: string) {
    const org = await this.getOrCreateOrgBySlug(orgSlug);

    const existing = await prisma.product.findFirst({
      where: { id, orgId: org.id },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    return prisma.product.delete({ where: { id } });
  }
}