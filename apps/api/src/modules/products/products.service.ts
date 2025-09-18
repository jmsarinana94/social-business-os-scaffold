// apps/api/src/modules/products/products.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface OrgRef {
  id?: string;
  slug?: string;
}

export type CreateProductDto = {
  sku: string;
  title: string;
  description?: string | null;
  type: 'PHYSICAL' | 'DIGITAL';
  status: 'ACTIVE' | 'INACTIVE';
  price: number;
};

export type UpdateProductDto = Partial<CreateProductDto>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- helpers --------------------------------------------------------------

  private toNumber(n: unknown): number | null {
    if (n == null) return null;
    if (typeof n === 'number') return n;
    // Prisma Decimal (or string) → number
    const asNum = Number((n as any)?.toString?.() ?? n);
    if (Number.isNaN(asNum)) return null;
    return asNum;
  }

  private serialize<T extends { price?: any; createdAt?: Date; updatedAt?: Date }>(row: T) {
    return {
      ...row,
      price: this.toNumber(row.price),
      createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
    };
  }

  private orgWhere(org: OrgRef): Prisma.OrganizationWhereUniqueInput {
    if (org?.id) return { id: org.id };
    if (org?.slug) return { slug: org.slug };
    throw new BadRequestException('Missing organization id or slug');
  }

  private ensureNonNegativePrice(dto: { price?: any }) {
    if (dto.price == null) throw new BadRequestException('price must be provided');
    const n = this.toNumber(dto.price);
    if (n == null || n < 0) throw new BadRequestException('price must be a non-negative number');
    return n;
  }

  // ---- queries --------------------------------------------------------------

  async findAll(org: OrgRef, page = 1, limit = 10) {
    const whereOrg = this.orgWhere(org);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: { org: { ...whereOrg } },
        orderBy: { createdAt: 'desc' },
        skip: (Math.max(page, 1) - 1) * Math.max(limit, 1),
        take: Math.max(limit, 1),
      }),
      this.prisma.product.count({ where: { org: { ...whereOrg } } }),
    ]);

    return {
      data: data.map((p) => this.serialize(p)),
      meta: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / Math.max(limit, 1))),
      },
    };
  }

  async findOne(org: OrgRef, id: string) {
    const whereOrg = this.orgWhere(org);
    const found = await this.prisma.product.findFirst({
      where: { id, org: { ...whereOrg } },
    });
    if (!found) throw new NotFoundException('product not found');
    return this.serialize(found);
  }

  // ---- mutations ------------------------------------------------------------

  async create(org: OrgRef, dto: CreateProductDto) {
    const whereOrg = this.orgWhere(org);
    const price = this.ensureNonNegativePrice(dto);

    if (!dto.sku?.trim()) throw new BadRequestException('sku is required');
    if (!dto.title?.trim()) throw new BadRequestException('title is required');

    try {
      const created = await this.prisma.product.create({
        data: {
          org: { connect: whereOrg },
          sku: dto.sku.trim(),
          title: dto.title.trim(),
          description: dto.description ?? null,
          type: dto.type,
          status: dto.status,
          price, // store as number; prisma will coerce to Decimal if needed
          inventoryQty: 0,
        },
      });
      return this.serialize(created);
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // unique constraint (e.g., SKU)
        throw new BadRequestException('sku already exists');
      }
      throw e;
    }
  }

  async update(org: OrgRef, id: string, dto: UpdateProductDto) {
    const whereOrg = this.orgWhere(org);

    const existing = await this.prisma.product.findFirst({
      where: { id, org: { ...whereOrg } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('product not found');

    const data: Prisma.ProductUpdateInput = {};
    if (dto.sku != null) data.sku = dto.sku.trim();
    if (dto.title != null) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.type != null) data.type = dto.type;
    if (dto.status != null) data.status = dto.status;
    if (dto.price != null) {
      const n = this.ensureNonNegativePrice({ price: dto.price });
      data.price = n;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });
    return this.serialize(updated);
  }

  async remove(org: OrgRef, id: string) {
    const whereOrg = this.orgWhere(org);

    const existing = await this.prisma.product.findFirst({
      where: { id, org: { ...whereOrg } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('product not found');

    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  // ---- inventory ------------------------------------------------------------

  async getInventory(org: OrgRef, id: string) {
    const whereOrg = this.orgWhere(org);
    const found = await this.prisma.product.findFirst({
      where: { id, org: { ...whereOrg } },
      select: { id: true, inventoryQty: true, price: true, createdAt: true, updatedAt: true },
    });
    if (!found) throw new NotFoundException('product not found');
    return this.serialize(found);
  }

  async addInventory(org: OrgRef, id: string, payload: { delta: number }) {
    const whereOrg = this.orgWhere(org);
    const delta = Number(payload?.delta);
    if (!Number.isFinite(delta) || Math.trunc(delta) !== delta) {
      throw new BadRequestException('delta must be an integer');
    }

    // Use a transaction + check to enforce non-negative inventory
    return await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id, org: { ...whereOrg } },
        select: { id: true, inventoryQty: true, price: true, createdAt: true, updatedAt: true },
      });
      if (!product) throw new NotFoundException('product not found');

      const next = (product.inventoryQty ?? 0) + delta;
      if (next < 0) {
        throw new BadRequestException('inventory cannot go below zero');
      }

      const updated = await tx.product.update({
        where: { id },
        data: { inventoryQty: next },
      });

      return this.serialize(updated);
    });
  }
}