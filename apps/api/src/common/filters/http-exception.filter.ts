import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError, ZodIssue } from 'zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Zod validation errors
    if (exception instanceof ZodError) {
      const details = exception.issues.map((i: ZodIssue) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      }));

      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: details.map((d: ZodIssue | { message: string }) =>
          // ZodIssue has .message; keep this tolerant
          (d as any).message,
        ),
        details,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    // Nest HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse() as
        | string
        | { message?: any; [k: string]: any };

      return res.status(status).json({
        statusCode: status,
        ...(typeof response === 'string' ? { message: response } : response),
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    // Fallback
    this.logger.error(
      `Unhandled error on ${req.method} ${req.url}`,
      (exception as any)?.stack ?? String(exception),
    );

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}