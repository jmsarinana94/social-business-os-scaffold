import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- helpers used by controller org resolver ---
  findOrgBySlug(slug: string) {
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, orgId: true } });
  }

  // --- product APIs ---
  async list(orgId: string) {
    return this.prisma.product.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        orgId: true,
        sku: true,
        title: true,
        description: true,
        type: true,
        status: true,
        price: true,
        inventoryQty: true,
        lastPurchasedAt: true,
      },
    });
  }

  async getById(orgId: string, id: string) {
    const prod = await this.prisma.product.findFirst({
      where: { id, orgId },
    });
    if (!prod) throw new NotFoundException('Product not found for this org');
    return prod;
  }

  async create(orgId: string, dto: CreateProductDto) {
    // If your schema has SKU globally unique, this will throw P2002 on duplicates (expected).
    // If you want per-org uniqueness instead, use a composite unique ([orgId, sku]) in Prisma schema.
    return this.prisma.product.create({
      data: {
        sku: dto.sku,
        title: dto.title,
        description: dto.description ?? null,
        type: (dto as any).type,     // string enums in your current schema
        status: (dto as any).status, // string enums in your current schema
        price: new Prisma.Decimal(dto.price),
        inventoryQty: dto.inventoryQty ?? 0,
        org: { connect: { id: orgId } },
      },
      select: {
        id: true,
        orgId: true,
        sku: true,
        title: true,
        price: true,
        inventoryQty: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(orgId: string, id: string, dto: UpdateProductDto) {
    // Guard that the product belongs to the org
    const exists = await this.prisma.product.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Product not found for this org');

    return this.prisma.product.update({
      where: { id },
      data: {
        sku: dto.sku ?? undefined,
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        type: (dto as any).type ?? undefined,
        status: (dto as any).status ?? undefined,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
        inventoryQty: dto.inventoryQty ?? undefined,
      },
    });
  }

  async remove(orgId: string, id: string) {
    const exists = await this.prisma.product.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Product not found for this org');
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }
}