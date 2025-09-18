import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function isPrismaDecimal(v: any): boolean {
  return !!v && typeof v === 'object' && typeof v.toString === 'function' && typeof v.toFixed === 'function';
}

function convert(value: any): any {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (isPrismaDecimal(value)) {
    const n = Number(value.toString());
    return Number.isNaN(n) ? value.toString() : n;
  }
  if (Array.isArray(value)) return value.map(convert);
  const out: Record<string, any> = {};
  for (const k of Object.keys(value)) out[k] = convert(value[k]);
  return out;
}

@Injectable()
export class DecimalToNumberInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => convert(data)));
  }
}