// apps/api/src/common/filters/zod-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError, ZodIssue } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

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
}