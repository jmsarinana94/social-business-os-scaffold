import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  // No global prefix (tests hit /auth/* and /products directly)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidUnknownValues: false, transform: true }));

  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || '127.0.0.1';
  await app.listen(port, host);
}
bootstrap();