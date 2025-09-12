import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    // Unique constraint violation
    if (e.code === 'P2002') {
      return res.status(HttpStatus.CONFLICT).json({
        statusCode: 409,
        error: 'Conflict',
        message: 'Unique constraint failed',
        meta: e.meta,
      });
    }

    // Foreign key constraint violation (e.g., bad orgId)
    if (e.code === 'P2003') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Foreign key constraint failed (check x-org / orgId)',
        meta: e.meta,
      });
    }

    // Fallback
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      error: 'Internal Server Error',
      message: `Prisma error ${e.code}`,
      meta: e.meta,
    });
  }
}