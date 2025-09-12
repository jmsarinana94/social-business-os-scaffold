import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './products.dto';

function normalizeType(t: string) {
  const u = t.toUpperCase();
  return u === 'DIGITAL' ? 'DIGITAL' : 'PHYSICAL';
}
function normalizeStatus(s: string) {
  const u = s.toUpperCase();
  return u === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
}
function skuOrGenerate(sku?: string) {
  if (sku && sku.trim().length > 0) return sku.trim();
  return `SKU-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
function toPriceString(p: string | number) {
  return typeof p === 'number' ? p.toString() : p;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireOrg(orgSlug?: string) {
    if (!orgSlug) throw new BadRequestException('x-org header is required');
    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException('Org not found');
    return org;
  }

  async list(orgSlug?: string) {
    const org = await this.requireOrg(orgSlug);
    const items = await this.prisma.product.findMany({
      where: { orgId: org.id },
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
    });
    return {
      data: items,
      meta: { page: 1, limit: 10, total: items.length },
    };
  }

  async get(orgSlug: string | undefined, id: string) {
    const org = await this.requireOrg(orgSlug);
    const item = await this.prisma.product.findFirst({ where: { id, orgId: org.id } });
    if (!item) throw new NotFoundException('Product not found');
    return item;
  }

  async create(dto: CreateProductDto, orgSlug?: string): Promise<Product> {
    const org = await this.requireOrg(orgSlug);

    const data: Prisma.ProductCreateInput = {
      sku: skuOrGenerate(dto.sku),
      title: dto.title,
      type: normalizeType(dto.type) as any,
      status: normalizeStatus(dto.status) as any,
      price: toPriceString(dto.price),
      description: dto.description ?? null,
      org: { connect: { id: org.id } },
    };

    try {
      return await this.prisma.product.create({ data });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException(
          'A product with this SKU already exists for this organization.',
        );
      }
      throw e;
    }
  }

  async update(orgSlug: string | undefined, id: string, dto: UpdateProductDto): Promise<Product> {
    const org = await this.requireOrg(orgSlug);

    const existing = await this.prisma.product.findFirst({ where: { id, orgId: org.id } });
    if (!existing) throw new NotFoundException('Product not found');

    const data: Prisma.ProductUpdateInput = {
      ...(dto.sku !== undefined ? { sku: skuOrGenerate(dto.sku) } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.type !== undefined ? { type: normalizeType(dto.type) as any } : {}),
      ...(dto.status !== undefined ? { status: normalizeStatus(dto.status) as any } : {}),
      ...(dto.price !== undefined ? { price: toPriceString(dto.price) } : {}),
      ...(dto.description !== undefined ? { description: dto.description ?? null } : {}),
    };

    try {
      return await this.prisma.product.update({
        where: { id },
        data,
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException(
          'A product with this SKU already exists for this organization.',
        );
      }
      throw e;
    }
  }

  async remove(orgSlug: string | undefined, id: string) {
    const org = await this.requireOrg(orgSlug);

    const existing = await this.prisma.product.findFirst({ where: { id, orgId: org.id } });
    if (!existing) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }
}