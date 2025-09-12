// apps/api/src/common/interceptors/idempotency.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';

type CacheKey = string;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private cache = new Map<CacheKey, { status: number; body: any; at: number }>();
  private ttlMs = 5 * 60 * 1000; // 5 minutes

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const key = req.headers['idempotency-key'] as string | undefined;
    if (!key) return next.handle();

    const route = req.originalUrl?.split('?')[0] ?? '';
    const orgId = req.org?.id ?? 'no-org';
    const cacheKey = `${orgId}:${method}:${route}:${key}`;

    const existing = this.cache.get(cacheKey);
    if (existing && Date.now() - existing.at < this.ttlMs) {
      res.status(existing.status);
      return of(existing.body);
    }

    return next.handle().pipe(
      tap((body) => {
        // Capture the status from response (default 200)
        const status = res.statusCode || 200;
        this.cache.set(cacheKey, { status, body, at: Date.now() });
      }),
    );
  }
}