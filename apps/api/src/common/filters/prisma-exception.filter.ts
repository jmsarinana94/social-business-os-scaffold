import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientUnknownRequestError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost) {
    const { httpAdapter } = this.adapterHost;
    const ctx = host.switchToHttp();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: any = {
      statusCode: status,
      message: 'Internal server error',
    };

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': // unique
          status = HttpStatus.CONFLICT;
          body = {
            statusCode: status,
            message: 'Unique constraint failed',
            meta: exception.meta,
          };
          break;
        case 'P2003': // FK
          status = HttpStatus.BAD_REQUEST;
          body = {
            statusCode: status,
            message: 'Foreign key constraint failed',
            meta: exception.meta,
          };
          break;
        case 'P2025': // not found
          status = HttpStatus.NOT_FOUND;
          body = { statusCode: status, message: 'Record not found' };
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          body = {
            statusCode: status,
            message: 'Database request error',
            code: exception.code,
            meta: exception.meta,
          };
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      body = { statusCode: status, message: 'Database validation error' };
    } else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      body = { statusCode: status, message: 'Database request error' };
    }

    httpAdapter.reply(ctx.getResponse(), body, status);
  }
}