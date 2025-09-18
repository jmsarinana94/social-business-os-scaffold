// apps/api/src/openapi/openapi.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as swaggerUi from 'swagger-ui-express';
import * as yaml from 'yaml';

@Module({})
export class OpenApiModule implements OnModuleInit {
  constructor(private readonly appRef: NestApplication) {}

  onModuleInit() {
    // Serve /docs using apps/api/openapi.yaml (adjust if your spec lives elsewhere)
    const specPath = path.resolve(process.cwd(), 'apps/api/openapi.yaml');
    if (!fs.existsSync(specPath)) {
      // no-op if spec missing; avoids boot failure
      return;
    }
    const spec = yaml.parse(fs.readFileSync(specPath, 'utf8'));
    // @ts-ignore types for swagger-ui-express are a bit loose
    this.appRef.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  }
}