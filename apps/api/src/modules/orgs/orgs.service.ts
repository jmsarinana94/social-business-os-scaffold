import { Injectable } from '@nestjs/common';
import { Organization, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Primary finder used across modules */
  async findBySlug(slug: string): Promise<Organization | null> {
    if (!slug) return null;
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  /** Idempotent ensure by slug (kept from earlier step) */
  async ensure(slug: string, name: string): Promise<Organization> {
    return this.prisma.organization.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
  }

  /** Create via object (original shape) */
  async create(input: { slug: string; name: string }): Promise<Organization>;

  /** Create via (slug, name) — used by your controller/tests */
  async create(slug: string, name?: string): Promise<Organization>;

  /** Impl for both create signatures */
  async create(
    arg1: { slug: string; name: string } | string,
    nameMaybe?: string,
  ): Promise<Organization> {
    const data: Prisma.OrganizationCreateInput =
      typeof arg1 === 'string'
        ? { slug: arg1, name: nameMaybe ?? arg1 }
        : { slug: arg1.slug, name: arg1.name };

    return this.prisma.organization.create({ data });
  }

  /** Controller/tests call this.orgs.get(slug) */
  async get(slug: string): Promise<Organization | null> {
    return this.findBySlug(slug);
  }

  /** Helper: orgs for a given user */
  async listForUser(userId: string) {
    return this.prisma.organization.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}