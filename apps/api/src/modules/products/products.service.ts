import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';

export type OrgRef = string;

// Normalize Prisma output to match tests:
// - price: number
// - createdAt/updatedAt: ISO strings
const normalize = (p: any) => ({
  ...p,
  price: typeof p?.price === 'number' ? p.price : Number(p?.price),
  createdAt: p?.createdAt ? new Date(p.createdAt).toISOString() : undefined,
  updatedAt: p?.updatedAt ? new Date(p.updatedAt).toISOString() : undefined,
});

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureOrg(org: OrgRef): Promise<string> {
    const id = org || 'org';
    const slug = id.toLowerCase();
    const upserted = await this.prisma.organization.upsert({
      where: { slug },
      update: {},
      create: { id, name: id, slug },
      select: { id: true },
    });
    return upserted.id;
  }

  async create(org: OrgRef, dto: CreateProductDto) {
    const orgId = await this.ensureOrg(org);
    try {
      const created = await this.prisma.product.create({
        data: {
          orgId,
          title: dto.title,
          type: dto.type as any,
          status: dto.status as any,
          price: dto.price,
          sku: dto.sku,
          description: dto.description ?? null,
          inventoryQty: dto.inventoryQty ?? 0,
        },
      });
      return normalize(created);
    } catch (err: any) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('SKU already exists for this org');
      }
      throw err;
    }
  }

  async list(org: OrgRef) {
    const orgId = await this.ensureOrg(org);
    const rows = await this.prisma.product.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(normalize);
  }

  async get(org: OrgRef, id: string) {
    const orgId = await this.ensureOrg(org);
    const found = await this.prisma.product.findUnique({ where: { id } });
    if (!found || found.orgId !== orgId) throw new NotFoundException();
    return normalize(found);
  }

  async update(org: OrgRef, id: string, dto: UpdateProductDto) {
    const orgId = await this.ensureOrg(org);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.orgId !== orgId) throw new NotFoundException();

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.type !== undefined) data.type = dto.type as any;
    if (dto.status !== undefined) data.status = dto.status as any;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.inventoryQty !== undefined) data.inventoryQty = dto.inventoryQty ?? 0;

    const updated = await this.prisma.product.update({ where: { id }, data });
    return normalize(updated);
  }

  async adjustInventory(org: OrgRef, id: string, delta: number) {
    if (Number.isNaN(delta)) throw new BadRequestException('Invalid delta');
    const orgId = await this.ensureOrg(org);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.orgId !== orgId) throw new NotFoundException();

    const currentQty = existing.inventoryQty ?? 0;
    const newQty = currentQty + delta;
    if (newQty < 0) throw new BadRequestException('Inventory cannot go below zero');

    const updated = await this.prisma.product.update({
      where: { id },
      data: { inventoryQty: newQty },
    });
    return normalize(updated);
  }

  async remove(org: OrgRef, id: string) {
    const orgId = await this.ensureOrg(org);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.orgId !== orgId) throw new NotFoundException();
    await this.prisma.product.delete({ where: { id } });
  }
}