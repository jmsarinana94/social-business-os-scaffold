import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.organization.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(data: { name: string; slug?: string }) {
    // prisma type requires slug, but schema often has slug unique & required
    // if slug omitted, derive a simple one
    const payload: Prisma.OrganizationCreateInput = {
      name: data.name,
      slug:
        (data.slug ?? data.name ?? 'org')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'org',
    };
    return this.prisma.organization.create({ data: payload });
  }

  async update(id: string, data: Partial<{ name: string; slug: string }>) {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Organization not found');

    const payload: Prisma.OrganizationUpdateInput = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.slug !== undefined) payload.slug = data.slug;

    return this.prisma.organization.update({ where: { id }, data: payload });
  }

  async remove(id: string) {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Organization not found');
    await this.prisma.organization.delete({ where: { id } });
    return { deleted: true };
  }
}