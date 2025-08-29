import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// Derive the exact `data` type that prisma.product.update expects in v6
type ProductUpdateData = Parameters<PrismaClient['product']['update']>[0]['data'];

function genSku() {
  return `SKU-${Math.random().toString(16).slice(2, 10)}`;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private toEnum(v?: string) {
    return typeof v === 'string' ? v.toLowerCase().trim() : v;
  }

  private async getOrCreateOrgBySlug(slug: string) {
    if (!slug || typeof slug !== 'string') {
      throw new Error('Missing x-org header');
    }
    return this.prisma.organization.upsert({
      where: { slug },
      update: {},
      create: { name: slug, slug },
    });
  }

  async list(orgSlug: string, page = 1, limit = 10) {
    const org = await this.getOrCreateOrgBySlug(orgSlug);
    const skip = Math.max(0, (page - 1) * limit);

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: { orgId: org.id } }),
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
    const product = await this.prisma.product.findFirst({
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
    const priceStr = String(dto.price); // Decimal -> string

    return this.prisma.product.create({
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
    const existing = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const data: ProductUpdateData = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = this.toEnum(dto.type)!;
    if (dto.status !== undefined) data.status = this.toEnum(dto.status)!;
    if (dto.price !== undefined) data.price = String(dto.price);
    if (dto.sku !== undefined) data.sku = dto.sku.trim();

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(orgSlug: string, id: string) {
    const org = await this.getOrCreateOrgBySlug(orgSlug);

    const existing = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.delete({ where: { id } });
  }
}