// apps/api/src/common/pipes/zod-validation.pipe.ts
import {
    ArgumentMetadata,
    BadRequestException,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodTypeAny } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform<T = unknown>(value: T, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (result.success) {
      // preserve parsed/coerced value
      return result.data as T;
    }

    const err = result.error as ZodError;
    throw new BadRequestException({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      issues: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      })),
    });
  }
}