import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  ping() {
    return { ok: true, service: 'api' };
  }
}