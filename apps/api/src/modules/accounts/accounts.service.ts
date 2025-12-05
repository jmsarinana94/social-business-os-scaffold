// apps/api/src/modules/accounts/accounts.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve org by slug or throw 404.
   */
  private async getOrgBySlug(orgSlug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!org) {
      throw new NotFoundException(`Organization "${orgSlug}" not found`);
    }

    return org;
  }

  /**
   * List all accounts for an org.
   */
  async list(orgSlug: string) {
    const org = await this.getOrgBySlug(orgSlug);

    return this.prisma.account.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new account in an org.
   */
  async create(
    orgSlug: string,
    ownerUserId: string | null,
    dto: CreateAccountDto,
  ) {
    const org = await this.getOrgBySlug(orgSlug);

    return this.prisma.account.create({
      data: {
        organizationId: org.id,
        name: dto.name,
        domain: dto.website ?? null,
        // For now we ignore any "notes" field and keep description null.
        description: null,
        ownerUserId: ownerUserId ?? null,
      },
    });
  }

  /**
   * Get a single account by id within an org.
   */
  async get(orgSlug: string, id: string) {
    const org = await this.getOrgBySlug(orgSlug);

    const account = await this.prisma.account.findFirst({
      where: {
        id,
        organizationId: org.id,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  /**
   * Update an account within an org.
   */
  async update(orgSlug: string, id: string, dto: UpdateAccountDto) {
    const org = await this.getOrgBySlug(orgSlug);

    const existing = await this.prisma.account.findFirst({
      where: {
        id,
        organizationId: org.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Account not found');
    }

    return this.prisma.account.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        domain: dto.website ?? existing.domain,
        // Keep existing description; not wired to dto yet.
        description: existing.description,
      },
    });
  }

  /**
   * Delete an account within an org.
   */
  async remove(orgSlug: string, id: string) {
    const org = await this.getOrgBySlug(orgSlug);

    const existing = await this.prisma.account.findFirst({
      where: {
        id,
        organizationId: org.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Account not found');
    }

    await this.prisma.account.delete({
      where: { id },
    });

    return { ok: true };
  }
}