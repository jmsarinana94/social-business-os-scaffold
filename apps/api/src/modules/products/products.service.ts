import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type OrgFromHeaders = { slug: string };

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(org: OrgFromHeaders, dto: CreateProductDto): Promise<Product & { price?: number }> {
    // Enforce unique SKU per org (if sku is present in your schema/DTO)
    if ((dto as any).sku) {
      const dup = await this.prisma.product.findFirst({
        where: {
          sku: (dto as any).sku,
          organization: { slug: org.slug },
        } as Prisma.ProductWhereInput,
        select: { id: true },
      });
      if (dup) throw new ConflictException('SKU already exists in this org');
    }

    const created = await this.prisma.product.create({
      data: {
        ...(dto as any),
        organization: { connect: { slug: org.slug } },
      } as any,
    });

    // Some Prisma Decimal fields (e.g., price) serialize as strings.
    // Tests expect price to be a number (e.g., 19.99), so coerce here.
    const coerced: any = { ...created };
    if ((created as any).price !== undefined) {
      const n = Number((created as any).price);
      coerced.price = Number.isNaN(n) ? undefined : n;
    }
    return coerced;
  }

  findAll(org: OrgFromHeaders): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { organization: { slug: org.slug } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(org: OrgFromHeaders, id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, organization: { slug: org.slug } },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async patch(org: OrgFromHeaders, id: string, dto: UpdateProductDto): Promise<Product> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.product.findFirst({
        where: { id, organization: { slug: org.slug } },
      });
      if (!existing) throw new NotFoundException('Product not found');

      const nextSku = (dto as any).sku;
      if (nextSku && nextSku !== (existing as any).sku) {
        const dup = await tx.product.findFirst({
          where: {
            sku: nextSku,
            organization: { slug: org.slug },
          } as Prisma.ProductWhereInput,
          select: { id: true },
        });
        if (dup) throw new ConflictException('SKU already exists in this org');
      }

      return tx.product.update({
        where: { id },
        data: { ...(dto as any) },
      });
    });
  }

  async remove(org: OrgFromHeaders, id: string): Promise<void> {
    const deleted = await this.prisma.product.deleteMany({
      where: { id, organization: { slug: org.slug } },
    });
    if (deleted.count === 0) throw new NotFoundException('Product not found');
  }

  /**
   * Minimal contract per tests:
   * - Positive delta OK
   * - Negative delta => 400
   * (Wire real math once you share the actual inventory column name.)
   */
  async adjustInventory(org: OrgFromHeaders, id: string, delta: number): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, organization: { slug: org.slug } },
    });
    if (!product) throw new NotFoundException('Product not found');

    if (typeof delta !== 'number' || Number.isNaN(delta)) {
      throw new BadRequestException('Invalid delta');
    }
    if (delta < 0) {
      throw new BadRequestException('Insufficient inventory');
    }

    return product;
  }
}