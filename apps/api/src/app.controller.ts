import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Root endpoint (optional) — quick health check
   */
  @Get('/')
  root() {
    return this.appService.health();
  }

  /**
   * Standard health endpoints — all return the same data
   */
  @Get(['/health', '/healthz', '/status', '/v1/health'])
  health() {
    return this.appService.health();
  }
}