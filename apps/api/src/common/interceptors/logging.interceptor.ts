import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;
    const started = Date.now();
    const rid = (req as any).requestId;
    return next.handle().pipe(
      tap(() => this.logger.log(`${method} ${originalUrl} ${Date.now() - started}ms rid=${rid ?? '-'}`)),
    );
  }
}