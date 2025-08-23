// apps/api/src/common/interceptors/response.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Small helpers for strict type narrowing
function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object';
}
function hasProp<T extends string>(
  o: Record<string, unknown>,
  k: T,
): o is Record<T, unknown> {
  return k in o;
}

type OkEnvelope<T = unknown> = { ok: boolean; data?: T; meta?: unknown };

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<OkEnvelope> {
    return next.handle().pipe(
      map((payload: unknown): OkEnvelope => {
        // 1) Allow controllers/services to opt-out by returning { ok: true/false, ... }
        if (isRecord(payload) && hasProp(payload, 'ok')) {
          // Assume the handler already shaped the response
          return payload as OkEnvelope;
        }

        // 2) Pass through paginated shapes { data, meta } and wrap with ok
        if (isRecord(payload) && hasProp(payload, 'data') && hasProp(payload, 'meta')) {
          return { ok: true, data: payload.data, meta: payload.meta };
        }

        // 3) Default success envelope
        return { ok: true, data: payload };
      }),
    );
  }
}