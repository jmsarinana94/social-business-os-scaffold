import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

// Optional: narrow Prisma error detection without importing Prisma directly.
type MaybePrismaError = {
  code?: string;
  meta?: Record<string, unknown>;
  name?: string;
  message?: string;
};

@Catch()
export class PrismaEchoFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    // Only handle HTTP context; otherwise fall back to default behavior.
    if (host.getType() !== 'http') {
      // For non-http (e.g., ws/rpc), rethrow and let Nest handle it.
      throw exception;
    }

    const { httpAdapter } = this.adapterHost;
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    // If response object is missing (very rare), just log and bail gracefully.
    if (!res || !httpAdapter) {
       
      console.error('[PrismaEchoFilter] No http adapter/response', { exception });
      return;
    }

    // If headers already sent, don’t try to write again.
    // Some Node adapters expose `headersSent`, others `isHeadersSent` via adapter.
    if (res.headersSent) {
      return;
    }

    // 1) If it’s a standard HttpException (Unauthorized, BadRequest, etc.), echo it safely.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();
      return httpAdapter.reply(
        res,
        typeof responseBody === 'object'
          ? responseBody
          : { statusCode: status, message: String(responseBody) },
        status,
      );
    }

    // 2) Try to recognize a Prisma error (best-effort; keeps logs friendly)
    const maybe = exception as MaybePrismaError;
    const isPrisma =
      !!maybe?.code || (maybe?.name && maybe.name.toLowerCase().includes('prisma'));

    if (isPrisma) {
      // Map a few common codes to 409/400; everything else 500
      // P2002 = Unique constraint; P2003 = FK constraint; P2025 = Record not found
      const map: Record<string, number> = {
        P2002: HttpStatus.CONFLICT,
        P2003: HttpStatus.BAD_REQUEST,
        P2025: HttpStatus.NOT_FOUND,
      };
      const status = maybe.code && map[maybe.code] ? map[maybe.code] : 500;

      const payload = {
        statusCode: status,
        error: 'PrismaError',
        code: maybe.code ?? 'UNKNOWN',
        message: maybe.message ?? 'Database error',
        meta: maybe.meta ?? null,
        path: req?.url,
        method: req?.method,
        timestamp: new Date().toISOString(),
      };

       
      console.error('[PrismaEchoFilter]', payload);

      return httpAdapter.reply(res, payload, status);
    }

    // 3) Fallback: generic 500
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = {
      statusCode: status,
      error: 'InternalServerError',
      message:
        (exception as any)?.message ??
        'Unexpected error. Please try again or contact support.',
      path: req?.url,
      method: req?.method,
      timestamp: new Date().toISOString(),
    };

     
    console.error('[UnhandledException]', exception);

    return httpAdapter.reply(res, payload, status);
  }
}