import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    orgId: string,
    params: {
      page?: number;
      limit?: number;
      q?: string;
      type?: 'physical' | 'digital';
      status?: 'active' | 'inactive';
    },
  ) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      orgId,
      ...(params.q ? { title: { contains: params.q, mode: 'insensitive' } } : {}),
      ...(params.type ? ({ type: params.type as any } as any) : {}),
      ...(params.status ? ({ status: params.status as any } as any) : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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

  async get(orgId: string, id: string) {
    const prod = await this.prisma.product.findFirst({ where: { id, orgId } });
    if (!prod) throw new NotFoundException('Product not found');
    return prod;
  }

  async create(orgId: string, dto: CreateProductDto) {
    // make sure org exists (idempotent)
    await this.prisma.organization.upsert({
      where: { id: orgId },
      create: { id: orgId, name: orgId, slug: orgId },
      update: {},
    });

    const created = await this.prisma.product.create({
      data: {
        orgId,
        title: dto.title,
        sku: dto.sku,
        type: dto.type as any,
        status: dto.status as any,
        price: dto.price ?? 0,
        inventoryQty: dto.inventoryQty ?? 0,
        description: dto.description ?? null,
      },
      select: { id: true },
    });

    return created;
  }

  async update(orgId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.get(orgId, id);

    const updated = await this.prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.type !== undefined ? ({ type: dto.type as any } as any) : {}),
        ...(dto.status !== undefined ? ({ status: dto.status as any } as any) : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.inventoryQty !== undefined ? { inventoryQty: dto.inventoryQty } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
      select: { id: true },
    });

    return updated;
  }

  async remove(orgId: string, id: string) {
    const existing = await this.get(orgId, id);
    await this.prisma.product.delete({ where: { id: existing.id } });
  }
}