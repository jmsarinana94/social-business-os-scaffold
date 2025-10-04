import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/products.dto';

type OrgRef = { orgId?: string; orgSlug?: string };

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ensure we have a concrete orgId (resolve slug if needed). */
  private async resolveOrgId(ref: OrgRef): Promise<string> {
    if (ref.orgId) {
      const found = await this.prisma.organization.findUnique({
        where: { id: ref.orgId },
        select: { id: true },
      });
      if (found) return found.id;
    }
    if (ref.orgSlug) {
      const org = await this.prisma.organization.upsert({
        where: { slug: ref.orgSlug },
        update: {},
        create: { slug: ref.orgSlug, name: ref.orgSlug },
        select: { id: true },
      });
      return org.id;
    }
    throw new BadRequestException(
      'Organization context required (id or slug)',
    );
  }

  async create(org: OrgRef, dto: CreateProductDto) {
    const orgId = await this.resolveOrgId(org);

    const data: Prisma.ProductCreateInput = {
      title: dto.title,
      type: dto.type, // must match Prisma enum names
      status: dto.status,
      price: dto.price,
      sku: dto.sku,
      description: dto.description ?? null,
      inventoryQty: dto.inventoryQty ?? 0,
      organization: { connect: { id: orgId } },
    };

    try {
      const created = await this.prisma.product.create({
        data,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          price: true,
          sku: true,
          description: true,
          inventoryQty: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return created;
    } catch (e: any) {
      // Unique constraint violations -> 409 Conflict
      if (e?.code === 'P2002') {
        // Optional: narrow to sku+org composite if present
        throw new ConflictException('SKU already exists in this organization');
      }
      // Validation or other Prisma errors -> 400
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  async list(org: OrgRef) {
    const orgId = await this.resolveOrgId(org);
    return this.prisma.product.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        price: true,
        sku: true,
        description: true,
        inventoryQty: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getOne(org: OrgRef, id: string) {
    const orgId = await this.resolveOrgId(org);
    const product = await this.prisma.product.findFirst({
      where: { id, orgId },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        price: true,
        sku: true,
        description: true,
        inventoryQty: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(org: OrgRef, id: string, dto: UpdateProductDto) {
    const orgId = await this.resolveOrgId(org);

    // Ensure the product belongs to the org
    const existing = await this.prisma.product.findFirst({
      where: { id, orgId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Product not found');

    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data: {
          title: dto.title ?? undefined,
          type: dto.type ?? undefined,
          status: dto.status ?? undefined,
          price: dto.price ?? undefined,
          sku: dto.sku ?? undefined,
          description:
            dto.description === undefined ? undefined : dto.description,
          inventoryQty:
            dto.inventoryQty === undefined ? undefined : dto.inventoryQty,
        },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          price: true,
          sku: true,
          description: true,
          inventoryQty: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return updated;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('SKU already exists in this organization');
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  async remove(org: OrgRef, id: string) {
    const orgId = await this.resolveOrgId(org);

    // Scope delete to org
    const existing = await this.prisma.product.findFirst({
      where: { id, orgId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }
}