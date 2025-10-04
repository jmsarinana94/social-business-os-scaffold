import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaEchoFilter } from './filters/prisma-echo.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix (controllers should NOT include /v1 themselves)
  app.setGlobalPrefix('v1');

  // CORS & validation
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
      // stopAtFirstError keeps error payloads smaller
      stopAtFirstError: true,
    }),
  );

  // Safe global exception filter (covers Prisma + HttpExceptions)
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaEchoFilter(httpAdapterHost));

  const port = Number(process.env.PORT || 4010);
  await app.listen(port);
   
  console.log(`API listening on http://localhost:${port}/v1`);
  // Optional: log resolved org for quick sanity
  if (process.env.ORG_SLUG) {
     
    console.log(`ORG slug: ${process.env.ORG_SLUG}`);
  }
}
bootstrap();