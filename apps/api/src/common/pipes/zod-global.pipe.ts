// apps/api/src/common/pipes/zod-global.pipe.ts
import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ZodGlobalValidationPipe implements PipeTransform {
  transform(value: unknown) {
    // Do nothing here — validation happens at the route-level pipes
    return value;
  }
}