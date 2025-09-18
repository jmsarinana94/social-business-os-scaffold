import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch(Prisma.PrismaClientValidationError, PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    // Unique constraint, etc.
    if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        const conflict = new ConflictException('Unique constraint failed');
        const r = conflict.getResponse();
        return res.status(conflict.getStatus()).json(r);
      }
    }

    // Validation at Prisma layer (missing required data, wrong types)
    if (exception instanceof Prisma.PrismaClientValidationError) {
      const bad = new BadRequestException('Invalid data for this operation');
      const r = bad.getResponse();
      return res.status(bad.getStatus()).json(r);
    }

    // Fallback
    const bad = new BadRequestException('Invalid request');
    const r = bad.getResponse();
    return res.status(bad.getStatus()).json(r);
  }
}