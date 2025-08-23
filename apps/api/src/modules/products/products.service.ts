// apps/api/src/modules/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ProductCreateDto, ProductUpdateDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List products with pagination and optional filters.
   * Returns a { data, meta } wrapper so e2e tests can assert on body.data/meta.
   */
  async list(
    orgId: string,
    query: {
      page?: number;
      limit?: number;
      q?: string;
      status?: 'active' | 'inactive';
      type?: string;
    },
  ) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit ?? 10)));

    const where: Prisma.ProductWhereInput = {
      orgId,
      ...(query.q
        ? { title: { contains: query.q, mode: 'insensitive' as const } }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single product by id, scoped to org.
   * Throws 404 if not found for this org.
   */
  async get(orgId: string, id: string) {
    const item = await this.prisma.product.findFirst({
      where: { id, orgId },
    });
    if (!item) {
      throw new NotFoundException('Product not found');
    }
    return item;
  }

  /**
   * Create a product. Connects to the org by id (does not set orgId directly in data).
   * Ensures Organization row exists to satisfy connect().
   */
  async create(orgId: string, dto: ProductCreateDto) {
    // Ensure the org exists so connect won't fail (no-op if it already exists).
    await this.prisma.organization.upsert({
      where: { id: orgId },
      create: { id: orgId, name: orgId },
      update: {},
    });

    return this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        status: dto.status ?? 'active',
        type: dto.type, // required by schema
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        org: { connect: { id: orgId } }, // ✅ connect to org
      },
    });
  }

  /**
   * Partial update. First verifies the row belongs to the org, then updates by id.
   */
  async update(orgId: string, id: string, dto: ProductUpdateDto) {
    // Ensure the product exists for this org (404 if not).
    await this.get(orgId, id);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
      },
    });
  }

  /**
   * Delete a product, scoped to org.
   */
  async remove(orgId: string, id: string) {
    // Ensure the product exists for this org (404 if not).
    await this.get(orgId, id);

    await this.prisma.product.delete({ where: { id } });
    return { id };
  }
}