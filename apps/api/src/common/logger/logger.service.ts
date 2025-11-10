import { Injectable } from '@nestjs/common';

/**
 * Minimal JSON-style logger without extending ConsoleLogger
 * to avoid signature override issues across Nest versions.
 */
@Injectable()
export class AppLogger {
  private fmt(level: string, message: any, meta?: Record<string, any>) {
    const base = { level, msg: message, ts: new Date().toISOString() };
    return JSON.stringify(meta && Object.keys(meta).length ? { ...base, ...meta } : base);
  }

  info(message: any, meta?: Record<string, any>) {
     
    console.info(this.fmt('info', message, meta));
  }
  warn(message: any, meta?: Record<string, any>) {
     
    console.warn(this.fmt('warn', message, meta));
  }
  error(message: any, meta?: Record<string, any>) {
     
    console.error(this.fmt('error', message, meta));
  }
  debug(message: any, meta?: Record<string, any>) {
     
    console.info(this.fmt('debug', message, meta));
  }
  verbose(message: any, meta?: Record<string, any>) {
     
    console.info(this.fmt('verbose', message, meta));
  }
}