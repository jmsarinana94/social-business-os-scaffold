import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

export type OrgRef = { id?: string; slug?: string };

import {
  AdjustInventoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './products.dto';

function ensureOrg(org: OrgRef): OrgRef {
  if (!org?.id && !org?.slug) {
    throw new BadRequestException('Missing x-org header');
  }
  return org;
}

function orgConnectArg(org: OrgRef): any {
  const o = ensureOrg(org);
  if (o.id) return { id: o.id } as any;
  return { slug: o.slug! } as any;
}

function orgFilter(org: OrgRef): any {
  const o = ensureOrg(org);
  if (o.id) return { id: o.id };
  return { slug: o.slug! };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- LIST ----------
  async findAll(org: OrgRef, page = 1, limit = 10) {
    const where = { org: { ...orgFilter(org) } };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const pages = Math.max(Math.ceil(total / limit) || 1, 1);
    return {
      data: data.map(this.serialize),
      meta: { page, limit, total, pages },
    };
  }

  // ---------- GET ONE ----------
  async findOne(org: OrgRef, id: string) {
    const item = await this.prisma.product.findFirst({
      where: { id, org: { ...orgFilter(org) } },
    });
    if (!item) throw new NotFoundException('product not found');
    return this.serialize(item);
  }

  // ---------- CREATE ----------
  async create(org: OrgRef, dto: CreateProductDto) {
    if (!dto?.title) throw new BadRequestException('title is required');
    if (!dto?.sku) throw new BadRequestException('sku is required');
    if (!dto?.type) throw new BadRequestException('type is required');
    if (!dto?.status) throw new BadRequestException('status is required');

    if (dto.price == null || Number.isNaN(Number(dto.price))) {
      throw new BadRequestException('price must be a number');
    }
    const priceNum = Number(dto.price);
    if (priceNum < 0) throw new BadRequestException('price must be a non-negative number');

    let initialQty = 0;
    if (dto.inventoryQty !== undefined) {
      const q = Number(dto.inventoryQty);
      if (!Number.isFinite(q) || q < 0) {
        throw new BadRequestException('inventoryQty must be a non-negative number');
      }
      initialQty = Math.floor(q);
    }

    try {
      const created = await this.prisma.product.create({
        data: {
          org: { connect: orgConnectArg(org) },
          sku: dto.sku,
          title: dto.title,
          description: dto.description ?? null,
          type: dto.type,
          status: dto.status,
          price: priceNum,
          inventoryQty: initialQty,
        },
      });
      return this.serialize(created);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        // Unique constraint (likely unique on orgId+sku)
        throw new ConflictException('SKU already exists in this org');
      }
      throw err;
    }
  }

  // ---------- UPDATE (partial) ----------
  async update(org: OrgRef, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, org: { ...orgFilter(org) } },
    });
    if (!existing) throw new NotFoundException('product not found');

    let pricePatch: number | undefined;
    if (dto.price !== undefined) {
      if (dto.price == null || Number.isNaN(Number(dto.price))) {
        throw new BadRequestException('price must be a number');
      }
      const n = Number(dto.price);
      if (n < 0) throw new BadRequestException('price must be a non-negative number');
      pricePatch = n;
    }

    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data: {
          sku: dto.sku ?? existing.sku,
          title: dto.title ?? existing.title,
          description:
            dto.description === undefined ? existing.description : dto.description,
          type: dto.type ?? existing.type,
          status: dto.status ?? existing.status,
          price: pricePatch ?? (existing as any).price,
        },
      });
      return this.serialize(updated);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('SKU already exists in this org');
      }
      throw err;
    }
  }

  // ---------- DELETE ----------
  async remove(org: OrgRef, id: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, org: { ...orgFilter(org) } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('product not found');

    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- INVENTORY (GET) ----------
  async getInventory(org: OrgRef, id: string) {
    const item = await this.prisma.product.findFirst({
      where: { id, org: { ...orgFilter(org) } },
      select: { id: true, inventoryQty: true },
    });
    if (!item) throw new NotFoundException('product not found');
    return { id: item.id, inventoryQty: item.inventoryQty };
  }

  // ---------- INVENTORY (ADJUST) ----------
  async addInventory(org: OrgRef, id: string, payload: AdjustInventoryDto) {
    const delta = Number(payload?.delta);
    if (!Number.isFinite(delta)) {
      throw new BadRequestException('delta must be a number');
    }

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.product.findFirst({
        where: { id, org: { ...orgFilter(org) } },
        select: { id: true, inventoryQty: true },
      });
      if (!item) throw new NotFoundException('product not found');

      const nextQty = item.inventoryQty + delta;
      if (nextQty < 0) {
        throw new BadRequestException('inventory cannot go below zero');
      }

      const updated = await tx.product.update({
        where: { id },
        data: { inventoryQty: nextQty },
      });

      return this.serialize(updated);
    });
  }

  // ---------- Serializer ----------
  private serialize(row: any) {
    const base = row && typeof row === 'object' ? { ...(row as Record<string, any>) } : row;
    const out: any = base;

    if (out?.price != null) {
      const asNum = Number(out.price);
      if (Number.isFinite(asNum)) out.price = asNum;
    }

    if (out?.createdAt instanceof Date) out.createdAt = out.createdAt.toISOString();
    if (out?.updatedAt instanceof Date) out.updatedAt = out.updatedAt.toISOString();
    if (out?.lastPurchasedAt instanceof Date)
      out.lastPurchasedAt = out.lastPurchasedAt.toISOString();

    return out;
    }
}