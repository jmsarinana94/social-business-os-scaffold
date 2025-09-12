// apps/api/src/common/pipes/zod-validation.pipe.ts
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodIssue, ZodTypeAny } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }

    const err: ZodError = result.error;
    const issues = err.issues.map((i: ZodIssue) => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }));

    throw new BadRequestException({
      message: 'Validation failed',
      issues,
    });
  }
}