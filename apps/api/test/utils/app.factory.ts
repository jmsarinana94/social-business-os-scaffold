// apps/api/test/utils/app.factory.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AllowAllJwtGuard } from './allow-all-jwt.guard';

export async function createAppWithJwtBypass(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(AllowAllJwtGuard)
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}