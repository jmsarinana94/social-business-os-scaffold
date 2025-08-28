import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const { httpAdapter } = this.adapterHost;

    // Default response
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    // Map common Prisma error codes to clean HTTP responses
    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        const fields = (exception.meta?.target as string[]) ?? [];
        message = `Unique constraint failed on: ${fields.join(', ')}`;
        statusCode = HttpStatus.CONFLICT;
        break;
      }
      case 'P2025': {
        // Record not found
        message = 'Resource not found';
        statusCode = HttpStatus.NOT_FOUND;
        break;
      }
      case 'P2003': {
        // Foreign key constraint failed
        message = 'Invalid reference (foreign key constraint failed)';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      }
      default: {
        // Keep default 500 with a safe message
        message = 'Internal server error';
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }

    const ctx = host.switchToHttp();
    const responseBody = {
      statusCode,
      message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }
}