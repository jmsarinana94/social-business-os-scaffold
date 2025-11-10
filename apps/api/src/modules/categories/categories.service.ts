// apps/api/src/modules/categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async orgIdFromSlug(slug: string): Promise<string> {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org.id;
  }

  async list(orgSlug: string) {
    const orgId = await this.orgIdFromSlug(orgSlug);
    return this.prisma.category.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(orgSlug: string, id: string) {
    const orgId = await this.orgIdFromSlug(orgSlug);
    const cat = await this.prisma.category.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(orgSlug: string, dto: CreateCategoryDto) {
    const orgId = await this.orgIdFromSlug(orgSlug);
    return this.prisma.category.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        description: dto.description ?? null, // optional field in Prisma
      },
    });
  }

  async update(orgSlug: string, id: string, dto: UpdateCategoryDto) {
    const orgId = await this.orgIdFromSlug(orgSlug);
    // Ensure it belongs to this org
    const exists = await this.prisma.category.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Category not found');

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
      },
    });
  }

  async remove(orgSlug: string, id: string) {
    const orgId = await this.orgIdFromSlug(orgSlug);
    const exists = await this.prisma.category.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Category not found');

    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }
}