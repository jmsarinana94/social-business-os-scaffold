// apps/api/src/health/health.controller.ts
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  get() {
    return { ok: true };
  }

  @Get('ready')
  async ready() {
    await this.prisma.$queryRawUnsafe('SELECT 1');
    return { ok: true, db: 'up' };
  }
}