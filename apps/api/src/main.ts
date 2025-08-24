// apps/api/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';

type RequestWithId = Request & { id?: string };

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Security + CORS
  app.use(helmet());
  app.use(cors());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Simple request-id passthrough (no 'any' usage)
  app.use((req: RequestWithId, _res: Response, next: NextFunction) => {
    const headerId = req.headers['x-request-id'] as string | undefined;
    if (headerId) req.id = headerId;
    next();
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);

   
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();