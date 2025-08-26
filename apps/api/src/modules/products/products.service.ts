import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from '../../products/dto/create-product.dto';
import { UpdateProductDto } from '../../products/dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    orgId: string,
    params: {
      page?: number;
      limit?: number;
      q?: string;
      type?: ProductType | 'physical' | 'digital';
      status?: ProductStatus | 'active' | 'inactive';
    } = {},
  ) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      orgId,
      ...(params.q ? { title: { contains: params.q, mode: 'insensitive' } } : {}),
      ...(params.type ? { type: params.type as ProductType } : {}),
      ...(params.status ? { status: params.status as ProductStatus } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          sku: true,
          title: true,
          type: true,
          status: true,
          price: true,
          inventoryQty: true,
          createdAt: true,
          updatedAt: true,
          description: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      ok: true,
      data,
      meta: {
        page,
        limit,
        total,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async create(orgId: string, dto: CreateProductDto) {
    await this.prisma.organization.upsert({
      where: { id: orgId },
      create: { id: orgId, name: orgId, slug: orgId },
      update: {},
    });

    const created = await this.prisma.product.create({
      data: {
        orgId,
        sku: dto.sku,
        title: dto.title,
        type: dto.type as ProductType,
        status: dto.status as ProductStatus,
        price: dto.price ?? 0,
        inventoryQty: dto.inventoryQty ?? 0,
        description: dto.description ?? null,
      },
      select: { id: true },
    });

    return { ok: true, data: created };
  }

  async findOne(orgId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, orgId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return { ok: true, data: product };
  }

  async update(orgId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.type !== undefined ? { type: dto.type as ProductType } : {}),
        ...(dto.status !== undefined ? { status: dto.status as ProductStatus } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.inventoryQty !== undefined ? { inventoryQty: dto.inventoryQty } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });

    return { ok: true, data: { id: updated.id } };
  }

  async remove(orgId: string, id: string) {
    const result = await this.prisma.product.deleteMany({
      where: { id, orgId },
    });
    if (result.count === 0) throw new NotFoundException('Product not found');
    return { ok: true };
  }
}