import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrgBySlugOrThrow(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  private toResponse(contact: any) {
    const name = [contact.firstName, contact.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      id: contact.id,
      name,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      title: contact.title,
      accountId: contact.accountId,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }

  async create(orgSlug: string, dto: CreateContactDto) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);
    const { name, firstName, lastName } = dto;

    let finalFirst = firstName;
    let finalLast = lastName;

    if (name && (!finalFirst && !finalLast)) {
      const parts = name.trim().split(/\s+/);
      finalFirst = parts[0] ?? '';
      finalLast = parts.slice(1).join(' ');
    }

    const contact = await this.prisma.contact.create({
      data: {
        organizationId: org.id,
        firstName: finalFirst ?? '',
        lastName: finalLast ?? '',
        email: dto.email,
        phone: dto.phone ?? null,
        title: dto.title ?? null,
        accountId: dto.accountId ?? null,
      },
    });

    return this.toResponse(contact);
  }

  async findAll(orgSlug: string, search?: string) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);

    const contacts = await this.prisma.contact.findMany({
      where: {
        organizationId: org.id,
        ...(search
          ? {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    // e2e expects an ARRAY response
    return contacts.map((c) => this.toResponse(c));
  }

  async findOne(orgSlug: string, id: string) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);

    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        organizationId: org.id,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.toResponse(contact);
  }

  async update(orgSlug: string, id: string, dto: UpdateContactDto) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);

    const existing = await this.prisma.contact.findFirst({
      where: {
        id,
        organizationId: org.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Contact not found');
    }

    const { name, firstName, lastName } = dto;

    let finalFirst = firstName ?? existing.firstName;
    let finalLast = lastName ?? existing.lastName;

    // If caller sends name but not firstName/lastName, split name
    if (name && !dto.firstName && !dto.lastName) {
      const parts = name.trim().split(/\s+/);
      finalFirst = parts[0] ?? '';
      finalLast = parts.slice(1).join(' ');
    }

    const contact = await this.prisma.contact.update({
      where: { id },
      data: {
        firstName: finalFirst,
        lastName: finalLast,
        email: dto.email ?? existing.email,
        phone: dto.phone ?? existing.phone,
        title: dto.title ?? existing.title,
        accountId: dto.accountId ?? existing.accountId,
      },
    });

    // e2e asserts updateRes.body.name === 'Jane Updated'
    return this.toResponse(contact);
  }

  async remove(orgSlug: string, id: string): Promise<void> {
    const org = await this.getOrgBySlugOrThrow(orgSlug);

    const existing = await this.prisma.contact.findFirst({
      where: {
        id,
        organizationId: org.id,
      },
      select: { id: true },
    });

    // 204 is fine even if it already doesn't exist (idempotent delete)
    if (!existing) {
      return;
    }

    await this.prisma.contact.delete({
      where: { id },
    });
  }
}