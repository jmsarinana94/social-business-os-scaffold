// test/e2e/support/e2e-app.factory.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';

export async function createE2EApp(): Promise<INestApplication> {
  const mod = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = mod.createNestApplication();

  // IMPORTANT: same pipes/settings as other passing suites
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // DO NOT set a global prefix here (keep it consistent with passing suites)
  // DO NOT enable versioning here unless all suites do

  await app.init();
  return app;
}