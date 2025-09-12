import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateProductDto, ProductStatusDto, ProductTypeDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function toEnumType(t: ProductTypeDto): ProductType {
  return t === ProductTypeDto.DIGITAL ? ProductType.DIGITAL : ProductType.PHYSICAL;
}
function toEnumStatus(s: ProductStatusDto): ProductStatus {
  return s === ProductStatusDto.INACTIVE ? ProductStatus.INACTIVE : ProductStatus.ACTIVE;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgSlug: string, opts: { page: number; limit: number }) {
    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException('Org not found');

    const skip = (opts.page - 1) * opts.limit;
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: opts.limit,
      }),
      this.prisma.product.count({ where: { orgId: org.id } }),
    ]);

    return { data, meta: { page: opts.page, limit: opts.limit, total } };
  }

  async get(orgSlug: string, id: string) {
    const prod = await this.prisma.product.findFirst({
      where: { id, org: { slug: orgSlug } },
    });
    if (!prod) throw new NotFoundException('Product not found');
    return prod;
  }

  async create(orgSlug: string, dto: CreateProductDto) {
    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException('Org not found');

    const sku = dto.sku && dto.sku.trim().length > 0 ? dto.sku : `SKU-${Date.now()}`;

    const data: Prisma.ProductCreateInput = {
      sku,
      title: dto.title,
      type: toEnumType(dto.type),
      status: toEnumStatus(dto.status),
      price: dto.price, // coerced to string by DTO
      description: dto.description ?? null,
      org: { connect: { id: org.id } },
    };

    return this.prisma.product.create({ data });
  }

  async update(orgSlug: string, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, org: { slug: orgSlug } },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const data: Prisma.ProductUpdateInput = {
      ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.type !== undefined ? { type: toEnumType(dto.type) } : {}),
      ...(dto.status !== undefined ? { status: toEnumStatus(dto.status) } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    };

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(orgSlug: string, id: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, org: { slug: orgSlug } },
    });
    if (!existing) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }
}