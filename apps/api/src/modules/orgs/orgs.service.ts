import { PrismaService } from '@/shared/prisma/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateOrgDto } from './dto/create-org.dto';

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string) {
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  async create(dto: CreateOrgDto) {
    try {
      return await this.prisma.organization.create({
        data: { slug: dto.slug, name: dto.name },
      });
    } catch (e: any) {
      // Prisma P2002 unique constraint
      if (e?.code === 'P2002') {
        throw new ConflictException('Organization slug already exists');
      }
      throw e;
    }
  }
}