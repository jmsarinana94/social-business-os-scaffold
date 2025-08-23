// apps/api/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });

  // Use class-validator/class-transformer based validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,            // coerce query/body types (e.g., page/limit to numbers)
      whitelist: true,            // strip unknown fields
      forbidNonWhitelisted: false // don’t 400 on extra fields (optional)
    }),
  );

  // Keep your response wrapper + error filter
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();