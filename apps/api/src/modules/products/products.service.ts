import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export type OrgRef = { id?: string; slug?: string };

function ensureOrg(org: OrgRef): OrgRef {
  if (!org || (!org.id && !org.slug)) throw new BadRequestException('Missing org');
  return org;
}

function orgConnectArg(org: OrgRef) {
  if (org.id) return { id: org.id };
  if (org.slug) return { slug: org.slug };
  return undefined;
}

function byOrg(org: OrgRef): Prisma.ProductWhereInput {
  if (org.id) return { organizationId: org.id };
  if (org.slug) return { organization: { is: { slug: org.slug } } };
  return {};
}

// Ensure dates are ISO strings and price is number for tests
const mapProduct = (p: any) => ({
  id: p.id,
  createdAt:
    p.createdAt instanceof Date
      ? p.createdAt.toISOString()
      : new Date(p.createdAt).toISOString(),
  updatedAt:
    p.updatedAt instanceof Date
      ? p.updatedAt.toISOString()
      : new Date(p.updatedAt).toISOString(),
  title: p.title,
  name: p.title, // some tests read `name`; mirror `title`
  sku: p.sku,
  description: p.description,
  type: p.type,
  status: p.status,
  price:
    typeof p.price === 'object' && p.price && 'toNumber' in p.price
      ? p.price.toNumber()
      : Number(p.price),
  inventoryQty: p.inventoryQty ?? 0,
});

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(org: OrgRef, page = 1, limit = 10) {
    ensureOrg(org);
    const where = byOrg(org);
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data: items.map(mapProduct), page, limit, total };
  }

  async findOne(org: OrgRef, id: string) {
    ensureOrg(org);
    const row = await this.prisma.product.findFirst({
      where: { AND: [{ id }, byOrg(org)] },
    });
    if (!row) throw new NotFoundException('Product not found');
    return mapProduct(row);
  }

  async create(org: OrgRef, dto: CreateProductDto) {
    ensureOrg(org);

    if (dto.inventoryQty !== undefined) {
      const q = Number(dto.inventoryQty);
      if (!Number.isFinite(q) || q < 0) {
        throw new BadRequestException('inventoryQty must be a non-negative number');
      }
    }

    const initialQty = dto.inventoryQty !== undefined ? Number(dto.inventoryQty) : 0;

    try {
      const row = await this.prisma.product.create({
        data: {
          title: dto.title,
          sku: dto.sku,
          description: dto.description ?? undefined,
          type: dto.type as ProductType,
          status: dto.status as ProductStatus,
          price: new Prisma.Decimal(dto.price as any),
          inventoryQty: initialQty,
          organization: { connect: orgConnectArg(org) },
        },
      });
      return mapProduct(row);
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('SKU must be unique within the organization');
      }
      throw e;
    }
  }

  async update(org: OrgRef, id: string, dto: UpdateProductDto) {
    ensureOrg(org);
    const existing = await this.prisma.product.findFirst({
      where: { AND: [{ id }, byOrg(org)] },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const data: Prisma.ProductUpdateInput = {};
    if (dto.title !== undefined) (data as any).title = dto.title;
    if (dto.sku !== undefined) (data as any).sku = dto.sku;
    if (dto.description !== undefined) (data as any).description = dto.description;
    if (dto.type !== undefined) (data as any).type = dto.type as unknown as ProductType;
    if (dto.status !== undefined) (data as any).status = dto.status as unknown as ProductStatus;
    if (dto.price !== undefined) (data as any).price = new Prisma.Decimal(dto.price as any);
    if (dto.inventoryQty !== undefined) (data as any).inventoryQty = Number(dto.inventoryQty);

    try {
      const row = await this.prisma.product.update({ where: { id }, data });
      return mapProduct(row);
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('SKU must be unique within the organization');
      }
      throw e;
    }
  }

  async remove(org: OrgRef, id: string) {
    ensureOrg(org);
    const exists = await this.prisma.product.findFirst({
      where: { AND: [{ id }, byOrg(org)] },
    });
    if (!exists) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
    return { id };
  }

  async getInventory(org: OrgRef, id: string) {
    ensureOrg(org);
    const item = await this.prisma.product.findFirst({
      where: { AND: [{ id }, byOrg(org)] },
      select: { id: true, inventoryQty: true },
    });
    if (!item) throw new NotFoundException('Product not found');
    return { id: item.id, inventoryQty: item.inventoryQty ?? 0 };
  }

  async addInventory(org: OrgRef, id: string, payload: { delta: number }) {
    ensureOrg(org);
    const delta = Number(payload?.delta ?? 0);
    const item = await this.prisma.product.findFirst({
      where: { AND: [{ id }, byOrg(org)] },
      select: { id: true, inventoryQty: true },
    });
    if (!item) throw new NotFoundException('Product not found');

    const nextQty = (item.inventoryQty ?? 0) + delta;
    if (nextQty < 0) throw new BadRequestException('Inventory cannot go negative');

    const updated = await this.prisma.product.update({
      where: { id },
      data: { inventoryQty: nextQty },
    });
    return mapProduct(updated);
  }
}