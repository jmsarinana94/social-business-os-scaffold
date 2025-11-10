import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create the NestJS app
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Enable CORS (important for Next.js local dev)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Allow an optional global prefix (e.g. GLOBAL_PREFIX=v1)
  const rawPrefix = process.env.GLOBAL_PREFIX ?? '';
  const normalizedPrefix = rawPrefix.replace(/^\/|\/$/g, ''); // trim slashes
  if (normalizedPrefix) {
    app.setGlobalPrefix(normalizedPrefix);
  }

  // Determine port
  const port = Number(process.env.PORT) || 4000;

  // Start server
  await app.listen(port, '0.0.0.0');
  const baseUrl = await app.getUrl();
  const fullUrl = normalizedPrefix ? `${baseUrl}/${normalizedPrefix}` : baseUrl;

  logger.log(`✅ API listening at ${fullUrl}`);
  console.info(`[Bootstrap] API listening at ${fullUrl}`);
}

bootstrap().catch((err) => {
   
  console.error('❌ Fatal bootstrap error:', err);
  process.exit(1);
});