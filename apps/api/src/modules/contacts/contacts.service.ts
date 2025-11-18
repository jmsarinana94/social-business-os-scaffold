// apps/api/src/modules/contacts/contacts.service.ts

import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
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
      throw new BadRequestException('Organization not found for given slug');
    }
    return org;
  }

  async list(orgSlug: string) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);
    return this.prisma.contact.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(orgSlug: string, dto: CreateContactDto) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);

    return this.prisma.contact.create({
      data: {
        organizationId: org.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: (dto as any).phone ?? null,      // safe in case phone exists
        title: (dto as any).title ?? null,      // "
        accountId: (dto as any).accountId ?? null, // "
      },
    });
  }

  async getByIdOrThrow(orgSlug: string, id: string) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId: org.id },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  async update(orgSlug: string, id: string, dto: UpdateContactDto) {
    const org = await this.getOrgBySlugOrThrow(orgSlug);

    // Ensure it belongs to this org
    const existing = await this.prisma.contact.findFirst({
      where: { id, organizationId: org.id },
    });
    if (!existing) {
      throw new NotFoundException('Contact not found');
    }

    const anyDto = dto as any;

    return this.prisma.contact.update({
      where: { id: existing.id },
      data: {
        firstName: dto.firstName ?? existing.firstName,
        lastName: dto.lastName ?? existing.lastName,
        email:
          dto.email === undefined ? existing.email : dto.email ?? null,
        phone:
          anyDto.phone === undefined ? existing.phone : anyDto.phone ?? null,
        title:
          anyDto.title === undefined ? existing.title : anyDto.title ?? null,
        accountId:
          anyDto.accountId === undefined
            ? existing.accountId
            : anyDto.accountId ?? null,
      },
    });
  }

  async delete(orgSlug: string, id: string): Promise<void> {
    const org = await this.getOrgBySlugOrThrow(orgSlug);

    const existing = await this.prisma.contact.findFirst({
      where: { id, organizationId: org.id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contact.delete({
      where: { id: existing.id },
    });
  }
}