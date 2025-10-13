import { Injectable, NotFoundException } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // List all products for an org
  async findAll(orgSlug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    return this.prisma.product.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  // One product (scoped to org)
  async findOne(orgSlug: string, id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const prod = await this.prisma.product.findFirst({
      where: { id, organizationId: org.id },
      include: { category: true },
    });
    if (!prod) throw new NotFoundException('Product not found');
    return prod;
  }

  // Create product (use simple categoryId field to satisfy UncheckedCreateInput)
  async create(orgSlug: string, dto: CreateProductDto) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    return this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        price: dto.price,
        sku: dto.sku,
        status: dto.status as $Enums.ProductStatus,
        type: dto.type as $Enums.ProductType,
        organizationId: org.id,
        inventoryQty: dto.inventoryQty ?? 0,
        // use the scalar field instead of nested connect to avoid XOR conflict
        categoryId: dto.categoryId ?? null,
      },
      include: { category: true },
    });
  }

  // Update product
  async update(orgSlug: string, id: string, dto: UpdateProductDto) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    // ensure in-org
    await this.prisma.product.findFirstOrThrow({
      where: { id, organizationId: org.id },
      select: { id: true },
    });

    return this.prisma.product.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        price: dto.price ?? undefined,
        sku: dto.sku ?? undefined,
        status: (dto.status as $Enums.ProductStatus | undefined) ?? undefined,
        type: (dto.type as $Enums.ProductType | undefined) ?? undefined,
        inventoryQty: dto.inventoryQty ?? undefined,
        // only touch categoryId if present (including null to clear)
        ...(Object.prototype.hasOwnProperty.call(dto, 'categoryId')
          ? { categoryId: dto.categoryId ?? null }
          : {}),
      },
      include: { category: true },
    });
  }

  // Delete product
  async remove(orgSlug: string, id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    // ensure in-org
    await this.prisma.product.findFirstOrThrow({
      where: { id, organizationId: org.id },
      select: { id: true },
    });

    return this.prisma.product.delete({ where: { id } });
  }

  // Read inventory
  async getInventory(orgSlug: string, id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const prod = await this.prisma.product.findFirst({
      where: { id, organizationId: org.id },
      select: { id: true, inventoryQty: true },
    });
    if (!prod) throw new NotFoundException('Product not found');
    return prod;
  }

  // Adjust inventory by delta
  async addInventory(orgSlug: string, id: string, delta: number) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    // ensure in-org
    await this.prisma.product.findFirstOrThrow({
      where: { id, organizationId: org.id },
      select: { id: true },
    });

    return this.prisma.product.update({
      where: { id },
      data: { inventoryQty: { increment: delta } },
      select: { id: true, inventoryQty: true },
    });
  }
}