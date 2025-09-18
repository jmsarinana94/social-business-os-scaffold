import { Controller, Get } from '@nestjs/common';
const startedAt = Date.now();

@Controller('health')
export class HealthController {
  @Get()
  basic() {
    return { ok: true, service: 'api', time: new Date().toISOString() };
  }

  @Get('z')
  healthz() {
    let version = '0.0.0';
    try {
      // Resolve from the app’s working dir (apps/api)
       
      const pkg = require(process.cwd() + '/package.json');
      version = pkg?.version ?? version;
    } catch {}
    return {
      ok: true,
      service: 'api',
      version,
      uptimeSec: Math.round((Date.now() - startedAt) / 1000),
      now: new Date().toISOString(),
    };
  }
}