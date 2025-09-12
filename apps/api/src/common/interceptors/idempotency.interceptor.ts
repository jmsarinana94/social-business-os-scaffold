import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import crypto from 'crypto';
import { Response } from 'express';
import { Observable, from } from 'rxjs';
import { RedisService } from 'src/infra/redis/redis.service';

type StoredResult = {
  status: number;
  headers?: Record<string, string>;
  body: unknown;
};

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly strict = process.env.IDEMPOTENCY_STRICT === '1';
  private readonly replayHeader =
    process.env.IDEMPOTENCY_REPLAY_HEADER || 'Idempotency-Replayed';
  private readonly ttlMs = Number(process.env.IDEMPOTENCY_TTL_MS || 5 * 60 * 1000);

  constructor(private readonly redisSvc: RedisService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<any>();
    const res = http.getResponse<Response>();

    const method = (req.method || '').toUpperCase();
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!isWrite) return next.handle();

    const org = req.headers?.['x-org'] || 'default';
    const idemKey: string | undefined = req.headers?.['idempotency-key'];

    if (!idemKey) return next.handle();

    const bodyHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body ?? {}))
      .digest('hex');

    const lockKey = `idem:${org}:${idemKey}:lock`;
    const dataKey = `idem:${org}:${idemKey}:data`;
    const redis = this.redisSvc.instance;

    return from(this.handleIdempotent(redis, lockKey, dataKey, bodyHash, res, next));
  }

  private async handleIdempotent(
    redis: import('ioredis').Redis,
    lockKey: string,
    dataKey: string,
    bodyHash: string,
    res: Response,
    next: CallHandler,
  ) {
    const existingRaw = await redis.get(dataKey);
    if (existingRaw) {
      const stored = JSON.parse(existingRaw) as StoredResult & { hash?: string };
      res.setHeader(this.replayHeader, 'true');
      this.applyStored(stored, res);
      return;
    }

    const locked = await redis.set(lockKey, '1', 'PX', 15_000, 'NX');

    if (!locked) {
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 100));
        const maybe = await redis.get(dataKey);
        if (maybe) {
          const stored = JSON.parse(maybe) as StoredResult;
          res.setHeader(this.replayHeader, 'true');
          this.applyStored(stored, res);
          return;
        }
      }
      res.status(425).json({ message: 'Too early - idempotent request in flight' });
      return;
    }

    try {
      const value = await (next.handle() as any).toPromise?.();
      const body = value ?? {};
      const status =
        (body as any)?.statusCode && typeof (body as any).statusCode === 'number'
          ? (body as any).statusCode
          : 201;
      const headers: Record<string, string> = {
        'content-type': 'application/json; charset=utf-8',
      };
      const toStore: StoredResult = { status, headers, body };

      await redis.set(
        dataKey,
        JSON.stringify({ hash: bodyHash, ...toStore }),
        'PX',
        this.ttlMs,
      );

      this.applyStored(toStore, res);
      return;
    } catch {
      const toStore: StoredResult = {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: { statusCode: 500, message: 'Internal server error' },
      };
      await redis.set(
        dataKey,
        JSON.stringify({ hash: bodyHash, ...toStore }),
        'PX',
        this.ttlMs,
      );
      this.applyStored(toStore, res);
      return;
    } finally {
      await redis.del(lockKey);
    }
  }

  private applyStored(stored: StoredResult, res: Response) {
    if (stored.headers) {
      for (const [k, v] of Object.entries(stored.headers)) res.setHeader(k, v);
    }
    res.status(stored.status).json(stored.body);
  }
}