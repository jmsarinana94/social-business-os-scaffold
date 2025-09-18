import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { DecimalToNumberInterceptor } from './common/interceptors/decimal-to-number.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new DecimalToNumberInterceptor());
  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`API listening on http://0.0.0.0:${port}`, 'Bootstrap');
}
bootstrap();