// apps/api/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security hardening
  app.use(helmet());
  app.enableCors({
    origin: true,          // allow all origins (adjust for your needs)
    credentials: false,
  });

  // Request body validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: false,
      transform: true,           // auto-transform primitives (e.g., strings to numbers)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Optional: API prefix (uncomment if you want /api/*)
  // app.setGlobalPrefix('api');

  // Swagger (disabled in production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Social OS API')
      .setDescription('Endpoints for auth and products')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          description: 'Paste JWT from /auth/login',
        },
        'JWT',
      )
      .addApiKey(
        { type: 'apiKey', name: 'x-org', in: 'header', description: 'Organization ID' },
        'X-ORG',
      )
      .build();

    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, doc);
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
   
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();