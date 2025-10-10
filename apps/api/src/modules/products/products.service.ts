import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const toApiProduct = (p: any) => {
  if (!p) return p;
  const price =
    p.price && typeof p.price === 'object' && typeof p.price.toNumber === 'function'
      ? p.price.toNumber()
      : typeof p.price === 'string'
        ? Number(p.price)
        : p.price;

  const createdAt =
    p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date(p.createdAt).toISOString();
  const updatedAt =
    p.updatedAt instanceof Date ? p.updatedAt.toISOString() : new Date(p.updatedAt).toISOString();

  return { ...p, price, createdAt, updatedAt };
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgSlug: string) {
    const list = await this.prisma.product.findMany({
      where: { organization: { slug: orgSlug } },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(toApiProduct);
  }

  async findOne(orgSlug: string, id: string) {
    const p = await this.prisma.product.findFirst({
      where: { id, organization: { slug: orgSlug } },
    });
    if (!p) throw new NotFoundException('Product not found');
    return toApiProduct(p);
  }

  async create(orgSlug: string, dto: CreateProductDto) {
    const exists = await this.prisma.product.findFirst({
      where: { sku: dto.sku, organization: { slug: orgSlug } },
    });
    if (exists) throw new ConflictException('SKU already exists in this org');

    const created = await this.prisma.product.create({
      data: {
        title: dto.title,
        type: dto.type,
        status: dto.status,
        price: dto.price,
        sku: dto.sku,
        description: dto.description ?? null,
        inventoryQty: dto.inventoryQty ?? 0,
        organization: { connect: { slug: orgSlug } },
      },
    });
    return toApiProduct(created);
  }

  async update(orgSlug: string, id: string, dto: UpdateProductDto) {
    const exists = await this.prisma.product.findFirst({
      where: { id, organization: { slug: orgSlug } },
    });
    if (!exists) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
    return toApiProduct(updated);
  }

  async remove(orgSlug: string, id: string) {
    const exists = await this.prisma.product.findFirst({
      where: { id, organization: { slug: orgSlug } },
    });
    if (!exists) throw new NotFoundException('Product not found');

    const deleted = await this.prisma.product.delete({ where: { id } });
    return toApiProduct(deleted); // tests expect 200 + body
  }

  async getInventory(orgSlug: string, id: string) {
    const p = await this.prisma.product.findFirst({
      where: { id, organization: { slug: orgSlug } },
    });
    if (!p) throw new NotFoundException('Product not found');
    return { id: p.id, inventoryQty: p.inventoryQty };
  }

  async addInventory(orgSlug: string, id: string, delta: number) {
    const p = await this.prisma.product.findFirst({
      where: { id, organization: { slug: orgSlug } },
    });
    if (!p) throw new NotFoundException('Product not found');

    const next = p.inventoryQty + delta;
    if (next < 0) throw new BadRequestException('Inventory cannot go below zero');

    const updated = await this.prisma.product.update({
      where: { id },
      data: { inventoryQty: next },
    });
    return toApiProduct(updated);
  }
}