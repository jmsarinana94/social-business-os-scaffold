import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Do NOT set a global prefix unless the tests use it.
  // app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // When running e2e with Supertest, the app is bootstrapped in tests;
  // this file mainly matters for "nest start" runs.
  await app.listen(process.env.PORT || 3000);
}
bootstrap();