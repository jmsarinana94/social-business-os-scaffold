// apps/api/src/common/filters/zod-exception.filter.ts
import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter } from '@nestjs/common';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    const payload = {
      message: 'Validation failed',
      issues: exception.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      })),
    };

    // Use Nest’s BadRequest shape & status
    const nestErr = new BadRequestException(payload);
    const status = nestErr.getStatus();
    const response = nestErr.getResponse();

    res.status(status).json(response);
  }
}