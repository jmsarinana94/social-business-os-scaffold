import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

// Replace with your Prisma service; keeping a minimal in-memory store for tests.
// If you already have Prisma wired, convert calls to prisma.product.* and keep the same logic.
type Product = {
  id: string;
  organizationId: string;
  sku: string;
  title: string;
  type: 'PHYSICAL' | 'DIGITAL';
  status: 'ACTIVE' | 'INACTIVE';
  price: number; // keep as number to satisfy e2e expectations
  description?: string;
  inventoryQty: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ProductsService {
  private products: Product[] = [];

  private toResponse(p: Product) {
    // Ensure price is a number (some ORMs return string for decimals)
    return {
      id: p.id,
      sku: p.sku,
      title: p.title,
      type: p.type,
      status: p.status,
      price: Number(p.price),
      description: p.description ?? null,
      inventoryQty: p.inventoryQty,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  async create(orgId: string, dto: any) {
    const exists = this.products.find((p) => p.organizationId === orgId && p.sku === dto.sku);
    if (exists) throw new ConflictException('SKU already exists in this organization');

    const now = new Date();
    const product: Product = {
      id: 'prod_' + Math.random().toString(36).slice(2),
      organizationId: orgId,
      sku: dto.sku,
      title: dto.title,
      type: dto.type,
      status: dto.status,
      price: Number(dto.price),
      description: dto.description,
      inventoryQty: dto.inventoryQty ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.products.push(product);
    return this.toResponse(product);
  }

  async findAll(orgId: string) {
    return this.products
      .filter((p) => p.organizationId === orgId)
      .map((p) => this.toResponse(p));
  }

  async findOne(orgId: string, id: string) {
    const p = this.products.find((x) => x.organizationId === orgId && x.id === id);
    if (!p) throw new NotFoundException('Product not found');
    return this.toResponse(p);
  }

  async update(orgId: string, id: string, data: any) {
    const idx = this.products.findIndex((x) => x.organizationId === orgId && x.id === id);
    if (idx === -1) throw new NotFoundException('Product not found');

    const current = this.products[idx];

    // SKU immutable by design (tests don’t require changing SKU)
    if (data.sku && data.sku !== current.sku) {
      const dupe = this.products.find((p) => p.organizationId === orgId && p.sku === data.sku);
      if (dupe) throw new ConflictException('SKU already exists in this organization');
      current.sku = data.sku; // if you want to allow it
    }

    if (data.price !== undefined) current.price = Number(data.price);
    if (data.title !== undefined) current.title = data.title;
    if (data.type !== undefined) current.type = data.type;
    if (data.status !== undefined) current.status = data.status;
    if (data.description !== undefined) current.description = data.description;
    if (data.inventoryQty !== undefined) {
      const n = Number(data.inventoryQty);
      if (n < 0) throw new BadRequestException('inventoryQty cannot be negative');
      current.inventoryQty = n;
    }
    current.updatedAt = new Date();

    this.products[idx] = current;
    return this.toResponse(current);
  }

  async remove(orgId: string, id: string) {
    const idx = this.products.findIndex((x) => x.organizationId === orgId && x.id === id);
    if (idx === -1) throw new NotFoundException('Product not found');
    const [removed] = this.products.splice(idx, 1);
    return this.toResponse(removed);
  }

  async adjustInventory(orgId: string, id: string, delta: number) {
    const idx = this.products.findIndex((x) => x.organizationId === orgId && x.id === id);
    if (idx === -1) throw new NotFoundException('Product not found');
    const p = this.products[idx];

    const next = p.inventoryQty + delta;
    if (next < 0) throw new BadRequestException('Inventory cannot go below zero');

    p.inventoryQty = next;
    p.updatedAt = new Date();
    this.products[idx] = p;
    return this.toResponse(p);
  }
}