import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

// Only coerce for these fields to avoid touching IDs etc.
const NUMERIC_FIELD_WHITELIST = new Set(['price']);

// Minimal duck-typing so we don't import Decimal directly
const isPrismaDecimal = (v: any) =>
  v &&
  typeof v === 'object' &&
  (typeof v.toNumber === 'function' || typeof v.toString === 'function');

function maybeCoerceNumericField(key: string, value: any) {
  if (!NUMERIC_FIELD_WHITELIST.has(key)) return value;

  // Prisma Decimal instance
  if (isPrismaDecimal(value)) {
    try {
      return value.toNumber();
    } catch {
      const s = value.toString?.() ?? String(value);
      const n = Number(s);
      return Number.isNaN(n) ? s : n;
    }
  }

  // If engine already returned a string, coerce it to number
  if (typeof value === 'string') {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }

  return value;
}

function convert(value: any): any {
  if (value == null) return value;

  if (Array.isArray(value)) return value.map(convert);

  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      // first, recursively convert nested values
      const converted = convert(v);
      // then, if this key is in the whitelist, coerce to number if safe
      out[k] = maybeCoerceNumericField(k, converted);
    }
    return out;
  }

  return value;
}

@Injectable()
export class DecimalToNumberInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => convert(data)));
  }
}