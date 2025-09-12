import { Controller, Get } from '@nestjs/common';

@Controller('version')
export class VersionController {
  @Get()
  getVersion() {
    return {
      name: 'api',
      version: process.env.npm_package_version ?? '0.1.0',
      env: process.env.NODE_ENV ?? 'development',
      commit: process.env.GIT_COMMIT ?? undefined,
      builtAt: process.env.BUILT_AT ?? undefined,
    };
  }
}