import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveOrgId(orgSlug?: string): Promise<string> {
    if (!orgSlug) throw new BadRequestException('Missing x-org header');
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException(`Organization not found: ${orgSlug}`);
    return org.id;
  }

  async findAll(orgSlug: string, page = 1, limit = 10) {
    const orgId = await this.resolveOrgId(orgSlug);
    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where: { orgId } }),
      this.prisma.product.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
    ]);
    const pages = Math.max(1, Math.ceil(total / limit));
    return { data, meta: { page, limit, total, pages } };
  }

  async findOne(orgSlug: string, id: string) {
    const orgId = await this.resolveOrgId(orgSlug);
    const product = await this.prisma.product.findFirst({ where: { id, orgId } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(orgSlug: string, dto: CreateProductDto) {
    const orgId = await this.resolveOrgId(orgSlug);

    const exists = await this.prisma.product.findFirst({
      where: { orgId, sku: dto.sku },
      select: { id: true },
    });
    if (exists) throw new ConflictException('SKU already exists in this org');

    const type = (dto.type as unknown as ProductType) ?? ProductType.PHYSICAL;
    const status = (dto.status as unknown as ProductStatus) ?? ProductStatus.ACTIVE;

    return this.prisma.product.create({
      data: {
        orgId,
        sku: dto.sku,
        title: dto.title,
        description: dto.description ?? null,
        type,
        status,
        price: new Prisma.Decimal(dto.price),
        inventoryQty: dto.inventoryQty ?? 0,
      },
    });
  }

  async update(orgSlug: string, id: string, dto: UpdateProductDto) {
    const orgId = await this.resolveOrgId(orgSlug);
    const existing = await this.prisma.product.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Product not found');

    if (dto.sku) {
      const dup = await this.prisma.product.findFirst({
        where: { orgId, sku: dto.sku, NOT: { id } },
        select: { id: true },
      });
      if (dup) throw new ConflictException('SKU already exists in this org');
    }

    const data: Prisma.ProductUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.sku !== undefined) data.sku = dto.sku;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type as unknown as ProductType;
    if (dto.status !== undefined) data.status = dto.status as unknown as ProductStatus;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.inventoryQty !== undefined) data.inventoryQty = dto.inventoryQty;

    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(orgSlug: string, id: string) {
    const orgId = await this.resolveOrgId(orgSlug);
    const existing = await this.prisma.product.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Product not found');
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  async getInventory(orgSlug: string, id: string) {
    const orgId = await this.resolveOrgId(orgSlug);
    const product = await this.prisma.product.findFirst({
      where: { id, orgId },
      select: { id: true, inventoryQty: true, lastPurchasedAt: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async addInventory(orgSlug: string, id: string, payload: any) {
    const orgId = await this.resolveOrgId(orgSlug);
    const deltaRaw = payload?.delta;
    const delta = typeof deltaRaw === 'string' ? Number(deltaRaw) : deltaRaw;
    if (typeof delta !== 'number' || Number.isNaN(delta)) {
      throw new BadRequestException('delta must be a number');
    }

    const existing = await this.prisma.product.findFirst({
      where: { id, orgId },
      select: { id: true, inventoryQty: true },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const current = existing.inventoryQty ?? 0;
    const next = current + delta;

    if (next < 0) {
      throw new BadRequestException('inventory cannot go below zero');
    }

    return this.prisma.product.update({
      where: { id },
      data: { inventoryQty: next },
    });
  }
}