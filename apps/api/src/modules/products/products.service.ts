import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

type CreateBody = {
  title: string;
  description?: string;
  price?: number;
  type?: string;   // 'physical' | 'digital'
  status?: string; // 'active' | 'inactive'
  sku?: string;    // optional in request; we will generate if missing
};

type UpdateBody = Partial<CreateBody>;

const asEnum = (v: string | undefined) =>
  typeof v === 'string' ? v.trim().toLowerCase() : undefined;

const genSku = () => `SKU-${randomUUID().replace(/-/g, '').slice(0, 8)}`;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureOrg(orgSlug: string) {
    const org = await this.prisma.organization.upsert({
      where: { slug: orgSlug },
      update: {},
      create: { slug: orgSlug, name: orgSlug },
    });
    return org.id;
  }

  async list(orgSlug: string, page = 1, limit = 10) {
    const orgId = await this.ensureOrg(orgSlug);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: { orgId } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(orgSlug: string, id: string) {
    const orgId = await this.ensureOrg(orgSlug);
    return this.prisma.product.findFirst({
      where: { id, orgId },
    });
  }

  async create(orgSlug: string, dto: CreateBody) {
    const orgId = await this.ensureOrg(orgSlug);

    const type = asEnum(dto.type) ?? 'physical';
    const status = asEnum(dto.status) ?? 'active';

    if (!['physical', 'digital'].includes(type)) {
      throw new Error(`Invalid type: ${dto.type}`);
    }
    if (!['active', 'inactive'].includes(status)) {
      throw new Error(`Invalid status: ${dto.status}`);
    }

    const sku = (dto.sku ?? genSku()).trim();

    return this.prisma.product.create({
      data: {
        orgId,
        sku, // REQUIRED by your schema
        title: dto.title,
        description: dto.description ?? '',
        price: dto.price ?? 0,
        type,
        status,
      },
    });
  }

  async update(orgSlug: string, id: string, dto: UpdateBody) {
    const orgId = await this.ensureOrg(orgSlug);

    const existing = await this.prisma.product.findFirst({
      where: { id, orgId },
      select: { id: true },
    });
    if (!existing) return null;

    const type = asEnum(dto.type);
    const status = asEnum(dto.status);

    if (type && !['physical', 'digital'].includes(type)) {
      throw new Error(`Invalid type: ${dto.type}`);
    }
    if (status && !['active', 'inactive'].includes(status)) {
      throw new Error(`Invalid status: ${dto.status}`);
    }

    // NOTE: we do NOT allow updating sku here (common practice)
    return this.prisma.product.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
    });
  }

  async remove(orgSlug: string, id: string) {
    const orgId = await this.ensureOrg(orgSlug);

    const existing = await this.prisma.product.findFirst({
      where: { id, orgId },
      select: { id: true },
    });
    if (!existing) return null;

    return this.prisma.product.delete({ where: { id } });
  }
}