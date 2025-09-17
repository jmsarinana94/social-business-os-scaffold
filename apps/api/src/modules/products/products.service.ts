import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

export type CreateDto = {
  sku?: string;
  title: string;
  description?: string | null;
  type: 'PHYSICAL' | 'DIGITAL';
  status: 'ACTIVE' | 'INACTIVE';
  price: string;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureOrg(orgSlug: string) {
    const org =
      (await this.prisma.organization.findUnique({
        where: { slug: orgSlug },
      })) ??
      (await this.prisma.organization.create({
        data: { slug: orgSlug, name: orgSlug },
      }));
    return org;
  }

  private normalizeEnum<T extends string>(
    value: string,
    allowed: readonly T[],
    field: string,
  ): T {
    const v = String(value).toUpperCase() as T;
    if (!allowed.includes(v)) {
      throw new BadRequestException(
        `${field} must be one of: ${allowed.join(', ')}`,
      );
    }
    return v;
  }

  private generateSku(prefix = 'AUTO') {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 8; i++) {
      s += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `${prefix}-${s}`;
  }

  async list(orgSlug: string, page = 1, limit = 10) {
    const org = await this.ensureOrg(orgSlug);
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
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
    const row = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
    });
    if (!row) throw new NotFoundException('Product not found');
    return row;
  }

  async create(orgSlug: string, dto: CreateDto) {
    const org = await this.ensureOrg(orgSlug);

    const type = this.normalizeEnum(dto.type, ['PHYSICAL', 'DIGITAL'], 'type') as ProductType;
    const status = this.normalizeEnum(dto.status, ['ACTIVE', 'INACTIVE'], 'status') as ProductStatus;

    const data: Prisma.ProductCreateInput = {
      sku: dto.sku ?? this.generateSku('AUTO'),
      title: dto.title,
      description: dto.description ?? null,
      type,
      status,
      price: dto.price,
      org: { connect: { id: org.id } },
    };

    return this.prisma.product.create({ data });
  }

  async update(orgSlug: string, id: string, dto: Partial<CreateDto>) {
    const org = await this.ensureOrg(orgSlug);
    const existing = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const data: Prisma.ProductUpdateInput = {
      sku: dto.sku ? { set: dto.sku } : undefined,
      title: dto.title ? { set: dto.title } : undefined,
      description:
        dto.description !== undefined ? { set: dto.description } : undefined,
      type: dto.type
        ? { set: (this.normalizeEnum(dto.type, ['PHYSICAL', 'DIGITAL'], 'type') as ProductType) }
        : undefined,
      status: dto.status
        ? { set: (this.normalizeEnum(dto.status, ['ACTIVE', 'INACTIVE'], 'status') as ProductStatus) }
        : undefined,
      price: dto.price ? { set: dto.price } : undefined,
    };

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(orgSlug: string, id: string) {
    const org = await this.ensureOrg(orgSlug);
    const existing = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
    });
    if (!existing) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  async getInventory(orgSlug: string, id: string) {
    const org = await this.ensureOrg(orgSlug);
    const row = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
      select: { id: true, inventoryQty: true },
    });
    if (!row) throw new NotFoundException('Product not found');
    return row;
  }

  // kept for compatibility if any caller still uses readInventory()
  async readInventory(orgSlug: string, id: string) {
    return this.getInventory(orgSlug, id);
  }

  async adjustInventory(orgSlug: string, id: string, delta: number) {
    const org = await this.ensureOrg(orgSlug);
    const product = await this.prisma.product.findFirst({
      where: { id, orgId: org.id },
      select: { id: true, inventoryQty: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const next = (product.inventoryQty ?? 0) + Number(delta);
    if (next < 0) {
      throw new BadRequestException('Inventory cannot go negative');
    }

    return this.prisma.product.update({
      where: { id },
      data: { inventoryQty: next },
    });
  }
}