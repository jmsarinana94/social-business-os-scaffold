import { Controller, Get, Header } from '@nestjs/common';

// Stubbed text metrics (Prometheus-ready later). No external deps.
@Controller()
export class MetricsController {
  @Get('/metrics')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  metrics() {
    const lines: string[] = [];
    lines.push('# HELP app_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE app_uptime_seconds gauge');
    lines.push(`app_uptime_seconds ${process.uptime().toFixed(0)}`);
    return lines.join('\n');
  }
}