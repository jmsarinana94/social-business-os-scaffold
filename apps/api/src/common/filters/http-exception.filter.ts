// apps/api/src/common/filters/http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError, ZodIssue } from 'zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Special formatting for Zod validation errors
    if (exception instanceof ZodError) {
      const details = exception.issues.map((i: ZodIssue) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      }));

      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'BadRequest',
        message: 'Validation failed',
        details,
        path: req.url,
        timestamp: new Date().toISOString(),
      });
    }

    // Standard Nest HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const normalized =
        typeof payload === 'string' ? { message: payload } : (payload as object);

      return res.status(status).json({
        statusCode: status,
        path: req.url,
        timestamp: new Date().toISOString(),
        ...normalized,
      });
    }

    // Fallback for unexpected errors
    // eslint-disable-next-line no-console
    console.error(exception);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'Unexpected error',
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}