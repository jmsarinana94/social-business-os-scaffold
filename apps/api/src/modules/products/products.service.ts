import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

export type CreateDto = {
  sku?: string;
  title: string;
  description?: string | null;
  type: 'PHYSICAL' | 'DIGITAL';
  status: 'ACTIVE' | 'INACTIVE';
  price: string; // stored as string/decimal in DB
};

export type UpdateDto = Partial<CreateDto>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureOrg(orgSlug: string) {
    let org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) {
      org = await this.prisma.organization.create({
        data: { slug: orgSlug, name: orgSlug },
      });
    }
    return org;
  }

  async list(orgSlug: string, page = 1, limit = 10) {
    const org = await this.ensureOrg(orgSlug);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: { orgId: org.id } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async get(orgSlug: string, id: string) {
    const org = await this.ensureOrg(orgSlug);
    const prod = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
    });
    if (!prod) throw new NotFoundException('Product not found');
    return prod;
  }

  async create(orgSlug: string, dto: CreateDto) {
    const org = await this.ensureOrg(orgSlug);

    // If SKU omitted, generate one
    const sku = dto.sku ?? `AUTO-${Math.random().toString(36).slice(2).toUpperCase()}`.slice(0, 16);

    // Prisma typed input (relation via `org`)
    const data: Prisma.ProductCreateInput = {
      sku, // required
      title: dto.title,
      description: dto.description ?? null,
      type: dto.type as any,
      status: dto.status as any,
      price: dto.price,
      org: { connect: { id: org.id } },
    };

    return this.prisma.product.create({ data });
  }

  async update(orgSlug: string, id: string, dto: UpdateDto) {
    const org = await this.ensureOrg(orgSlug);
    const exists = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Product not found');

    const data: Prisma.ProductUpdateInput = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.type !== undefined ? { type: dto.type as any } : {}),
      ...(dto.status !== undefined ? { status: dto.status as any } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
    };

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(orgSlug: string, id: string) {
    const org = await this.ensureOrg(orgSlug);
    const exists = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  async getInventory(orgSlug: string, id: string) {
    const org = await this.ensureOrg(orgSlug);
    const prod = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
      select: { id: true, inventoryQty: true },
    });
    if (!prod) throw new NotFoundException('Product not found');
    return { id: prod.id, inventoryQty: prod.inventoryQty };
  }

  async adjustInventory(orgSlug: string, id: string, delta: number) {
    const org = await this.ensureOrg(orgSlug);
    const prod = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
      select: { id: true, inventoryQty: true },
    });
    if (!prod) throw new NotFoundException('Product not found');

    const next = (prod.inventoryQty ?? 0) + (delta ?? 0);

    if (next < 0) {
      // <-- Return 400 instead of throwing a generic Error (which was 500)
      throw new BadRequestException('Inventory cannot go negative');
    }

    return this.prisma.product.update({
      where: { id: prod.id },
      data: { inventoryQty: next },
    });
  }
}
