import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe<T = unknown> implements PipeTransform<T> {
  constructor(private readonly schema?: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    // If no schema was provided, pass through
    if (!this.schema) return value as T;

    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      // Bubble up a structured error Nest can serialize
      throw new BadRequestException({
        message: 'Validation failed',
        issues: parsed.error.issues,
      });
    }

    return parsed.data;
  }
}

/**
 * Small helper to instantiate the pipe with inference:
 *   @UsePipes(zodPipe(mySchema))
 */
export const zodPipe = <T>(schema: ZodSchema<T>) =>
  new ZodValidationPipe<T>(schema);