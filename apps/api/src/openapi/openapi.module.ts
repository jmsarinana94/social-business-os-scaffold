// apps/api/src/openapi/openapi.module.ts
import { Module } from '@nestjs/common';

/**
 * Minimal placeholder OpenAPI module so AppModule can import it
 * without pulling in swagger deps during tests.
 *
 * If you later want Swagger UI, you can expand this module
 * (or call a static setup() from main.ts) — but for now it’s no-op.
 */
@Module({})
export class OpenApiModule {}