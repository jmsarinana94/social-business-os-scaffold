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

  transform(value: unknown, _meta: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const e: ZodError = result.error;
      throw new BadRequestException(
        e.issues.map(
          (i) => `${i.path.join('.')}: ${i.message}`,
        ),
      );
    }
    return result.data;
  }
}