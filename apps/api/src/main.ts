// apps/api/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import 'reflect-metadata';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Security middleware
  app.use(helmet());

  // CORS (wide-open by default; tighten for prod as needed)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Validation + transformation for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                   // strips unknown properties
      transform: true,                   // enables class-transformer
      forbidUnknownValues: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Optional: Swagger (only if @nestjs/swagger is installed)
  try {
    // Dynamically import so the app still boots without the package
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('API')
      .setDescription('Service API documentation')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  } catch {
    // Swagger not installed; skip without failing
  }

  const host = process.env.HOST ?? '0.0.0.0';
  const port = Number(process.env.PORT ?? 4000);

  await app.listen(port, host);
  const url = await app.getUrl();
   
  console.log(`🚀 API listening at ${url}`);
}

bootstrap();