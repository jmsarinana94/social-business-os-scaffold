// src/common/prisma-exception.filter.ts
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Prisma v6-compatible exception filter.
 * Narrow by `.code` instead of using PrismaClientKnownRequestError class.
 */
@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (isCode(exception, 'P2002')) {
      return res.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: 'Unique constraint violation',
        path: req.url,
      });
    }

    if (isCode(exception, 'P2025')) {
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: 'Record not found',
        path: req.url,
      });
    }

    // Pass through to Nest default handlers / other filters
    throw exception;
  }
}

function isCode(ex: unknown, code: string): ex is { code: string } {
  return !!ex && typeof ex === 'object' && 'code' in ex && (ex as any).code === code;
}