import {
  ArgumentsHost,
  Catch,
  ExceptionFilter
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // P2002 unique constraint
    if (exception.code === 'P2002') {
      const message = 'Duplicate value violates a unique constraint';
      return response.status(409).json({
        statusCode: 409,
        message,
        error: 'Conflict',
      });
    }

    // Fallback – don’t leak internals
    return response.status(400).json({
      statusCode: 400,
      message: 'Invalid data for this operation',
      error: 'Bad Request',
    });
  }
}