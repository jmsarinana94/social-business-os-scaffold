// apps/api/src/common/filters/prisma-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // Pass through if it's already an HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return response.status(status).json(exception.getResponse());
    }

    // Prisma Known Errors
    if (this.isPrismaKnownError(exception)) {
      const e = exception as Prisma.PrismaClientKnownRequestError;
      switch (e.code) {
        case 'P2002': // unique violation
          return response.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            error: 'P2002',
            message:
              'A product with this SKU already exists for this organization.',
          });
        case 'P2025': // record not found
          return response.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            error: 'P2025',
            message: 'Resource not found.',
          });
        case 'P2003': // FK constraint
          return response.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            error: 'P2003',
            message: 'Foreign key constraint failed.',
          });
        default:
          // fallthrough to generic
          break;
      }
    }

    // Generic 500
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }

  private isPrismaKnownError(ex: unknown): ex is Prisma.PrismaClientKnownRequestError {
    return Boolean(
      ex &&
        typeof ex === 'object' &&
        'code' in (ex as any) &&
        (ex as any).constructor?.name === 'PrismaClientKnownRequestError',
    );
  }
}