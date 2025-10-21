import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type ProductWithPrismaDecimal = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  categoryId: string | null;
  title: string;
  sku: string;
  description: string | null;
  type: string;
  status: string;
  price: Prisma.Decimal | number | string;
  inventoryQty: number;
  lastPurchasedAt: Date | null;
};

function toPlainProduct(p: ProductWithPrismaDecimal) {
  const price =
    typeof p.price === 'object' && p.price && 'toNumber' in p.price
      ? (p.price as Prisma.Decimal).toNumber()
      : Number(p.price);
  return { ...p, price };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgSlug: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException('Organization not found');

    const items = await this.prisma.product.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    });

    return items.map(toPlainProduct);
  }

  async findOne(orgSlug: string, id: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException('Organization not found');

    const item = await this.prisma.product.findFirst({
      where: { id, organizationId: org.id },
    });
    if (!item) throw new NotFoundException('Product not found');

    return toPlainProduct(item);
  }

  async create(orgSlug: string, dto: CreateProductDto) {
    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException('Organization not found');

    if (!dto?.sku) throw new BadRequestException('sku is required');

    const dup = await this.prisma.product.findFirst({
      where: { organizationId: org.id, sku: dto.sku },
      select: { id: true },
    });
    if (dup) throw new ConflictException('SKU already exists in this org');

    // Use relation connects for BOTH org and category to stay on the "checked" input
    const created = await this.prisma.product.create({
      data: {
        organization: { connect: { id: org.id } }, // ← relation connect (no organizationId scalar)
        title: dto.title,
        sku: dto.sku,
        description: dto.description ?? null,
        type: dto.type as any,
        status: dto.status as any,
        price: dto.price as any,
        inventoryQty: dto.inventoryQty ?? 0,
        ...((dto as any).categoryId
          ? { category: { connect: { id: (dto as any).categoryId } } }
          : {}),
      },
    });

    return toPlainProduct(created as unknown as ProductWithPrismaDecimal);
  }

  async update(orgSlug: string, id: string, dto: UpdateProductDto) {
    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException('Organization not found');

    const existing = await this.prisma.product.findFirst({
      where: { id, organizationId: org.id },
      select: { id: true, sku: true },
    });
    if (!existing) throw new NotFoundException('Product not found');

    if (dto.sku && dto.sku !== existing.sku) {
      const dup = await this.prisma.product.findFirst({
        where: { organizationId: org.id, sku: dto.sku },
        select: { id: true },
      });
      if (dup) throw new ConflictException('SKU already exists in this org');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.type !== undefined ? { type: dto.type as any } : {}),
        ...(dto.status !== undefined ? { status: dto.status as any } : {}),
        ...(dto.price !== undefined ? { price: dto.price as any } : {}),
        ...(dto.inventoryQty !== undefined ? { inventoryQty: dto.inventoryQty } : {}),
        ...((dto as any).categoryId !== undefined
          ? (dto as any).categoryId
            ? { category: { connect: { id: (dto as any).categoryId } } }
            : { category: { disconnect: true } }
          : {}),
      },
    });

    return toPlainProduct(updated as unknown as ProductWithPrismaDecimal);
  }

  async adjustInventory(orgSlug: string, id: string, delta: number) {
    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException('Organization not found');

    const product = await this.prisma.product.findFirst({
      where: { id, organizationId: org.id },
      select: { id: true, inventoryQty: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const nextQty = product.inventoryQty + delta;
    if (nextQty < 0) throw new BadRequestException('Inventory cannot go below zero');

    const updated = await this.prisma.product.update({
      where: { id },
      data: { inventoryQty: nextQty },
    });

    return toPlainProduct(updated as unknown as ProductWithPrismaDecimal);
  }

  async remove(orgSlug: string, id: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException('Organization not found');

    const existing = await this.prisma.product.findFirst({
      where: { id, organizationId: org.id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const deleted = await this.prisma.product.delete({ where: { id } });
    return toPlainProduct(deleted as unknown as ProductWithPrismaDecimal);
  }
}