import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      ok: true,
      uptime: process.uptime(),
      time: new Date().toISOString(),
    };
  }

  @Get('ready')
  async ready() {
    // TODO: Add real checks here (DB ping, Redis ping, etc.)
    // Example once you’re ready:
    // await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  }
}