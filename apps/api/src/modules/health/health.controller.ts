import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  @HttpCode(200)
  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(200)
  ready() {
    return { status: 'ready' };
  }

  @Get('live')
  @HttpCode(200)
  live() {
    return { status: 'live' };
  }
}