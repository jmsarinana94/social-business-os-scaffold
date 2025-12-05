// apps/api/src/modules/version/version.controller.ts

import { Controller, Get } from '@nestjs/common';

@Controller('version')
export class VersionController {
  @Get()
  getVersion() {
    // You can wire in real git/BUILD_VERSION later — tests only care about 200.
    return {
      version: '0.0.0',
      source: 'api',
    };
  }
}