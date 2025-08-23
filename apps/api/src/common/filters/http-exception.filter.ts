// apps/api/src/common/filters/http-exception.filter.ts
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

@Catch() // catch all, but format known cases nicely
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Prefer response header if present, fall back to request header
    const requestId =
      (typeof res.get === 'function' ? res.get('x-request-id') : undefined) ??
      (req.headers['x-request-id'] as string | undefined);

    // 1) Zod validation errors
    if (exception instanceof ZodError) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        ok: false as const,
        error: {
          message: 'Validation failed',
          statusCode: HttpStatus.BAD_REQUEST,
          code: 'VALIDATION_ERROR',
          details: exception.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
            code: i.code,
          })),
        },
        requestId,
      });
    }

    // 2) Nest HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const body =
        typeof response === 'object' && response !== null ? (response as Record<string, unknown>) : {};

      // message can be string | string[] depending on the thrown exception
      const rawMessage = (body.message ?? exception.message) as unknown;
      const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : String(rawMessage ?? 'Error');

      const code =
        (typeof body.error === 'string' && body.error) ||
        (typeof body.code === 'string' && body.code) ||
        'HTTP_ERROR';

      return res.status(status).json({
        ok: false as const,
        error: {
          message,
          statusCode: status,
          code,
          details: body.details,
        },
        requestId,
      });
    }

    // 3) Unknown error
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    return res.status(status).json({
      ok: false as const,
      error: {
        message: 'Internal server error',
        statusCode: status,
        code: 'INTERNAL_ERROR',
      },
      requestId,
    });
  }
}