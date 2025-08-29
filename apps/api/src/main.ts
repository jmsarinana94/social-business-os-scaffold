import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());

  const config = new DocumentBuilder()
    .setTitle('Social Business OS API')
    .setDescription('API docs')
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'x-org', in: 'header' }, 'org')
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  const adapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaExceptionFilter(adapterHost));

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port, '127.0.0.1');
   
  console.log(`🚀 API listening at http://127.0.0.1:${port}`);
}
bootstrap();