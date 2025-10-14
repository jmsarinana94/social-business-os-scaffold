import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreateViaController = {
  sku: string;
  name?: string; // controller variant
  priceCents?: number; // controller variant
  description?: string | null;
  type?: ProductType;
  status?: ProductStatus;
  inventoryQty?: number;
};

type CreateViaTests = {
  sku: string;
  title?: string; // tests send "title"
  price?: number; // tests send "price"
  description?: string | null;
  type?: ProductType;
  status?: ProductStatus;
  inventoryQty?: number;
};

export type CreateProductDto = CreateViaController | CreateViaTests;

type PatchViaController = Partial<{
  sku: string;
  name: string;
  priceCents: number;
  description: string | null;
  type: ProductType;
  status: ProductStatus;
  inventoryQty: number;
}>;

type PatchViaTests = Partial<{
  sku: string;
  title: string;
  price: number;
  description: string | null;
  type: ProductType;
  status: ProductStatus;
  inventoryQty: number;
}>;

export type PatchProductDto = PatchViaController | PatchViaTests;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------- helpers -----------------

  private requireOrgHeader(orgHeader?: string) {
    if (!orgHeader) throw new BadRequestException('X-Org header required');
  }

  /** Resolve X-Org as id or slug. In e2e, auto-create if missing. */
  private async resolveOrg(orgHeader: string) {
    const found = await this.prisma.organization.findFirst({
      where: { OR: [{ id: orgHeader }, { slug: orgHeader }] },
    });
    if (found) return found;

    if (process.env.E2E_AUTO_CREATE_ORG === 'true') {
      return this.prisma.organization.create({
        data: { name: orgHeader, slug: orgHeader },
      });
    }

    throw new BadRequestException('Organization not found for X-Org');
  }

  /** Convert Prisma Decimal price -> number in API responses */
  private toView<T extends { price: Prisma.Decimal }>(
    p: T,
  ): Omit<T, 'price'> & { price: number } {
    return { ...p, price: Number(p.price) };
  }

  private normalizeCreate(dto: CreateProductDto) {
    const sku = (dto as any).sku;
    if (!sku?.trim()) throw new BadRequestException('sku is required');

    const title = (dto as any).title ?? (dto as any).name;
    if (!title?.trim()) throw new BadRequestException('title/name is required');

    let price: Prisma.Decimal | undefined;
    if ((dto as any).priceCents != null) {
      const cents = (dto as any).priceCents;
      if (typeof cents !== 'number' || Number.isNaN(cents))
        throw new BadRequestException('priceCents must be a number');
      price = new Prisma.Decimal(cents).div(100);
    }
    if (price == null && (dto as any).price != null) {
      const p = (dto as any).price;
      if (typeof p !== 'number' || Number.isNaN(p))
        throw new BadRequestException('price must be a number');
      price = new Prisma.Decimal(p);
    }
    if (price == null) {
      throw new BadRequestException('price or priceCents is required');
    }

    const description =
      (dto as any).description !== undefined ? (dto as any).description : null;

    const type: ProductType = (dto as any).type ?? ProductType.PHYSICAL;
    const status: ProductStatus = (dto as any).status ?? ProductStatus.ACTIVE;
    const inventoryQty: number =
      (dto as any).inventoryQty != null ? (dto as any).inventoryQty : 0;

    return { title, price, sku, description, type, status, inventoryQty };
  }

  private normalizePatch(dto: PatchProductDto): Prisma.ProductUpdateInput {
    const data: Prisma.ProductUpdateInput = {};

    if ('title' in dto && dto.title !== undefined) data.title = dto.title!;
    if ('name' in dto && dto.name !== undefined) data.title = dto.name!;
    if ('sku' in dto && dto.sku !== undefined) data.sku = dto.sku!;
    if ('description' in dto && dto.description !== undefined)
      data.description = dto.description!;

    if ('priceCents' in dto && dto.priceCents !== undefined) {
      const cents = dto.priceCents!;
      if (typeof cents !== 'number' || Number.isNaN(cents))
        throw new BadRequestException('priceCents must be a number');
      data.price = new Prisma.Decimal(cents).div(100);
    } else if ('price' in dto && dto.price !== undefined) {
      const p = dto.price!;
      if (typeof p !== 'number' || Number.isNaN(p))
        throw new BadRequestException('price must be a number');
      data.price = new Prisma.Decimal(p);
    }

    if ('inventoryQty' in dto && dto.inventoryQty !== undefined)
      data.inventoryQty = dto.inventoryQty!;
    if ('type' in dto && dto.type !== undefined) data.type = dto.type!;
    if ('status' in dto && dto.status !== undefined) data.status = dto.status!;

    return data;
  }

  // ----------------- queries -----------------

  async findAll(orgHeader?: string) {
    this.requireOrgHeader(orgHeader);
    const org = await this.resolveOrg(orgHeader!);

    const rows = await this.prisma.product.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((p) => this.toView(p));
  }

  async findOne(orgHeader: string | undefined, id: string) {
    this.requireOrgHeader(orgHeader);
    const org = await this.resolveOrg(orgHeader!);

    // fetch by id first, then verify org (avoids accidental 404s)
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.organizationId !== org.id) {
      throw new NotFoundException('Product not found');
    }
    return this.toView(product);
  }

  // ----------------- mutations -----------------

  async create(orgHeader: string | undefined, dto: CreateProductDto) {
    this.requireOrgHeader(orgHeader);
    const org = await this.resolveOrg(orgHeader!);
    const norm = this.normalizeCreate(dto);

    const existing = await this.prisma.product.findFirst({
      where: { organizationId: org.id, sku: norm.sku },
    });
    if (existing) {
      // tests expect 409
      throw new ConflictException('SKU already exists in this organization');
    }

    const created = await this.prisma.product.create({
      data: {
        organizationId: org.id,
        title: norm.title,
        sku: norm.sku,
        description: norm.description,
        price: norm.price,
        inventoryQty: norm.inventoryQty,
        type: norm.type,
        status: norm.status,
      },
    });

    return this.toView(created);
  }

  async patch(orgHeader: string | undefined, id: string, dto: PatchProductDto) {
    this.requireOrgHeader(orgHeader);
    const org = await this.resolveOrg(orgHeader!);

    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current || current.organizationId !== org.id) {
      throw new NotFoundException('Product not found');
    }

    const nextSku = (dto as any).sku;
    if (nextSku && nextSku !== current.sku) {
      const conflict = await this.prisma.product.findFirst({
        where: { organizationId: org.id, sku: nextSku },
      });
      if (conflict) {
        throw new ConflictException('Another product with this SKU already exists');
      }
    }

    const data = this.normalizePatch(dto);
    const updated = await this.prisma.product.update({ where: { id }, data });
    return this.toView(updated);
  }

  async adjustInventory(orgHeader: string | undefined, id: string, delta: number) {
    this.requireOrgHeader(orgHeader);
    const org = await this.resolveOrg(orgHeader!);

    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current || current.organizationId !== org.id) {
      throw new NotFoundException('Product not found');
    }

    const newQty = current.inventoryQty + delta;
    if (newQty < 0) {
      throw new BadRequestException('Inventory cannot go below zero');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { inventoryQty: newQty },
    });

    return this.toView(updated);
  }

  async remove(orgHeader: string | undefined, id: string) {
    this.requireOrgHeader(orgHeader);
    const org = await this.resolveOrg(orgHeader!);

    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current || current.organizationId !== org.id) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }
}