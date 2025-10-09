import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';

type CreateDto = {
  title: string;
  sku: string;
  description?: string | null;
  type: ProductType;
  status: ProductStatus;
  price: number;
  inventoryQty?: number;
};
type UpdateDto = Partial<CreateDto>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async countByOrgSlug(slug: string) {
    return this.prisma.product.count({ where: { organization: { slug } } });
  }

  async listByOrgSlug(slug: string, page = 1, limit = 10) {
    const where = { organization: { slug } };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { total, items, page, limit };
  }

  async getOne(slug: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organization: { slug } },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(slug: string, dto: CreateDto) {
    let initialQty = 0;
    if (dto.inventoryQty !== undefined) {
      const q = Number(dto.inventoryQty);
      if (!Number.isFinite(q) || q < 0) throw new BadRequestException('inventoryQty must be a non-negative number');
      initialQty = q;
    }

    return this.prisma.product.create({
      data: {
        title: dto.title,
        sku: dto.sku,
        description: dto.description ?? null,
        type: dto.type,
        status: dto.status,
        price: new Prisma.Decimal(dto.price),
        organization: { connect: { slug } },
        inventoryQty: initialQty,
      },
    });
  }

  async update(slug: string, id: string, dto: UpdateDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, organization: { slug } },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const data: Prisma.ProductUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.sku !== undefined) data.sku = dto.sku;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.type !== undefined) data.type = dto.type as unknown as ProductType;
    if (dto.status !== undefined) data.status = dto.status as unknown as ProductStatus;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.inventoryQty !== undefined) data.inventoryQty = dto.inventoryQty;

    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(slug: string, id: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, organization: { slug } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Product not found');
    await this.prisma.product.delete({ where: { id } });
    return { id };
  }

  async adjustInventory(slug: string, id: string, delta: number) {
    const existing = await this.prisma.product.findFirst({
      where: { id, organization: { slug } },
      select: { id: true, inventoryQty: true, lastPurchasedAt: true },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const newQty = (existing.inventoryQty ?? 0) + delta;
    if (newQty < 0) throw new BadRequestException('Resulting inventory would be negative');

    return this.prisma.product.update({
      where: { id },
      data: { inventoryQty: newQty },
      select: { id: true, inventoryQty: true },
    });
  }
}