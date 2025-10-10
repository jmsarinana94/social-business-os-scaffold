import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an org (idempotent by slug).
   */
  async create(input: { slug: string; name: string }) {
    const { slug, name } = input;
    return this.prisma.organization.upsert({
      where: { slug },
      create: { slug, name },
      update: { name },
    });
  }

  /**
   * Return the current org from X-Org header.
   */
  async getCurrentOrg(slug: string) {
    return this.findBySlug(slug);
  }

  /**
   * Find org by slug or 404.
   */
  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException(`Org not found: ${slug}`);
    return org;
  }
}