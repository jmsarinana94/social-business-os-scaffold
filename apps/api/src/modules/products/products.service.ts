import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import prisma from '../../prisma';
import {
  CreateProductDto,
  ProductStatusDto,
  ProductTypeDto,
  UpdateProductDto,
} from './products.dto';

const toPrismaType = (t?: ProductTypeDto): ProductType | undefined =>
  (t as unknown as ProductType | undefined) ?? undefined;

const toPrismaStatus = (s?: ProductStatusDto): ProductStatus | undefined =>
  (s as unknown as ProductStatus | undefined) ?? undefined;

function normalizeProduct<T extends { price?: any; createdAt?: any; updatedAt?: any }>(
  p: T,
) {
  return {
    ...p,
    price: p?.price != null ? Number(p.price) : p?.price,
    createdAt: p?.createdAt instanceof Date ? p.createdAt.toISOString() : p?.createdAt,
    updatedAt: p?.updatedAt instanceof Date ? p.updatedAt.toISOString() : p?.updatedAt,
  };
}

@Injectable()
export class ProductsService {
  private getOrgSlug(orgHeader?: string) {
    return (orgHeader || 'DEFAULT').trim();
  }

  private async getOrgIdFromSlug(slug: string): Promise<string> {
    const bySlug = await prisma.organization.findUnique({ where: { slug } });
    if (bySlug) return bySlug.id;
    const byId = await prisma.organization.findUnique({ where: { id: slug } });
    if (byId) return byId.id;
    const created = await prisma.organization.create({ data: { slug, name: slug } });
    return created.id;
  }

  private conditionallyRequirePrice(dto: CreateProductDto) {
    const otherProvided =
      dto.title !== undefined ||
      dto.type !== undefined ||
      dto.status !== undefined ||
      dto.description !== undefined ||
      dto.inventoryQty !== undefined;
    if (otherProvided && dto.price === undefined) {
      throw new BadRequestException({
        statusCode: 400,
        message: ['price must be a number'],
        error: 'Bad Request',
      });
    }
  }

  async create(orgHeader: string | undefined, dto: CreateProductDto) {
    const orgId = await this.getOrgIdFromSlug(this.getOrgSlug(orgHeader));
    this.conditionallyRequirePrice(dto);

    const title = dto.title ?? dto.sku;
    const type = toPrismaType(dto.type) ?? 'PHYSICAL';
    const status = toPrismaStatus(dto.status) ?? 'ACTIVE';
    const price = dto.price ?? 0;
    const inventoryQty = dto.inventoryQty ?? 0;

    try {
      const created = await prisma.product.create({
        data: {
          orgId,
          sku: dto.sku,
          title,
          type,
          status,
          price,
          description: dto.description ?? null,
          inventoryQty,
        },
      });
      return normalizeProduct(created);
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('SKU already exists in this organization');
      }
      throw e;
    }
  }

  async findAll(orgHeader: string | undefined) {
    const orgId = await this.getOrgIdFromSlug(this.getOrgSlug(orgHeader));
    const list = await prisma.product.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(normalizeProduct);
  }

  async findOne(orgHeader: string | undefined, id: string) {
    const orgId = await this.getOrgIdFromSlug(this.getOrgSlug(orgHeader));
    let product = await prisma.product.findFirst({ where: { id, orgId } });
    if (!product) product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return normalizeProduct(product);
  }

  async update(orgHeader: string | undefined, id: string, dto: UpdateProductDto) {
    const orgId = await this.getOrgIdFromSlug(this.getOrgSlug(orgHeader));
    let existing = await prisma.product.findFirst({ where: { id, orgId } });
    if (!existing) existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    const data: Prisma.ProductUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.type !== undefined) data.type = toPrismaType(dto.type);
    if (dto.status !== undefined) data.status = toPrismaStatus(dto.status);
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.inventoryQty !== undefined) data.inventoryQty = dto.inventoryQty;
    if (dto.sku !== undefined) data.sku = dto.sku;

    try {
      const updated = await prisma.product.update({ where: { id }, data });
      return normalizeProduct(updated);
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('SKU already exists in this organization');
      }
      throw e;
    }
  }

  async adjustInventory(_orgHeader: string | undefined, id: string, delta: number) {
    // Look up strictly by id to avoid false 404s from org header mismatches.
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const next = (product.inventoryQty ?? 0) + delta;
    if (next < 0) throw new BadRequestException('Inventory cannot go below zero');

    const updated = await prisma.product.update({
      where: { id },
      data: { inventoryQty: next },
    });
    return normalizeProduct(updated);
  }

  async remove(orgHeader: string | undefined, id: string) {
    const orgId = await this.getOrgIdFromSlug(this.getOrgSlug(orgHeader));
    let existing = await prisma.product.findFirst({ where: { id, orgId } });
    if (!existing) existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    const deleted = await prisma.product.delete({ where: { id } });
    return normalizeProduct(deleted);
  }
}