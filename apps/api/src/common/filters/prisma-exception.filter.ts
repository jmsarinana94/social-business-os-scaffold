// apps/api/src/common/filters/prisma-exception.filter.ts
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const status = HttpStatus.BAD_REQUEST;

    let body: Record<string, unknown> = {
      statusCode: status,
      message: 'Prisma error',
    };

    if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        body = { statusCode: status, message: 'Unique constraint violation', meta: exception.meta };
      } else if (exception.code === 'P2025') {
        body = { statusCode: status, message: 'Record not found', meta: exception.meta };
      } else {
        body = { statusCode: status, message: exception.message, code: exception.code, meta: exception.meta };
      }
    }

    res.status(status).json(body);
  }
}