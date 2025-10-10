import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { snapshot: true });

  // CORS for local dev/tools
  app.enableCors();

  // Validation behavior expected by e2e tests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // strip unknown props
      forbidNonWhitelisted: true,   // 400 on extra props
      transform: true,              // transform primitives (e.g., params)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // If you want a global prefix later: app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);

  const logger = new Logger('NestApplication');
  logger.log(`✅ API listening on http://localhost:${port}`);
}
bootstrap();