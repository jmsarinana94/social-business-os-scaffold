import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new organization.
   */
  async create(dto: CreateOrgDto) {
    return this.prisma.organization.create({
      data: {
        slug: dto.slug,
        name: dto.name,
      },
    });
  }

  /**
   * List all orgs (useful for admin/debug).
   */
  async findAll() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find an org by primary id.
   */
  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  /**
   * Find an org by slug (used for multi-tenant lookups).
   */
  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (!org) throw new NotFoundException(`Organization with slug '${slug}' not found`);
    return org;
  }

  /**
   * Convenience used by /orgs/me — same as findBySlug but named for route intent.
   */
  async getCurrentOrg(slug: string) {
    return this.findBySlug(slug);
  }

  /**
   * Update an org's mutable fields.
   */
  async update(id: string, dto: UpdateOrgDto) {
    // ensure it exists (and throw 404 if not)
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
      },
    });
  }

  /**
   * Delete an org.
   */
  async remove(id: string) {
    // ensure it exists (and throw 404 if not)
    await this.findOne(id);
    return this.prisma.organization.delete({
      where: { id },
    });
  }
}