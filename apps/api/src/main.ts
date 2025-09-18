import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as rateLimit from 'express-rate-limit';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { DecimalToNumberInterceptor } from './common/interceptors/decimal-to-number.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Versioning -> /v1/**
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Middlewares
  app.use(cookieParser());
  app.use(
    rateLimit.default({
      windowMs: 60_000,
      limit: 200,
      standardHeaders: true,
      legacyHeaders: false,
    }) as any,
  );

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Convert Prisma Decimal -> number on all responses
  app.useGlobalInterceptors(new DecimalToNumberInterceptor());

  // Swagger
  const cfg = new DocumentBuilder()
    .setTitle('Social Business OS – API')
    .setDescription('Public API (v1)')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addSecurityRequirements('bearer')
    .build();
  const doc = SwaggerModule.createDocument(app, cfg);
  SwaggerModule.setup('/docs', app, doc);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`[Bootstrap] API listening on http://0.0.0.0:${port}`);
  console.log(`[Bootstrap] Swagger UI available at http://localhost:${port}/docs`);
}
bootstrap();