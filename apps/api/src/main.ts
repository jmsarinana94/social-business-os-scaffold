import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes/middleware
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );
  app.enableCors();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Social Business OS – API')
    .setDescription('REST endpoints for auth & products')
    .setVersion(process.env.npm_package_version ?? '0.1.0')
    .addBearerAuth() // Authorization: Bearer <token>
    .addApiKey(
      { type: 'apiKey', name: 'x-org', in: 'header', description: 'Organization slug' },
      'x-org',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}
bootstrap();