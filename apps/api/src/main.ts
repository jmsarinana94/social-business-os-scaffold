import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Use CommonJS import to avoid type deps; keeps build green if packages change.
const bodyParser = require('body-parser');

async function setupSwagger(app: any) {
  // Don’t enable Swagger in tests by default.
  if (process.env.NODE_ENV === 'test') return;

  // Opt-out with SWAGGER=false
  if (String(process.env.SWAGGER || 'true').toLowerCase() === 'false') return;

  try {
    // Dynamic import so mismatched versions don’t break build.
    const swagger = await import('@nestjs/swagger');
    const config = new swagger.DocumentBuilder()
      .setTitle('Social Business OS API')
      .setDescription('API docs for Social Business OS')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const doc = swagger.SwaggerModule.createDocument(app, config);
    swagger.SwaggerModule.setup('docs', app, doc);
     
    console.log('[swagger] Docs enabled at /docs');
  } catch (err) {
     
    console.warn(
      '[swagger] Skipped (package not available or version mismatch)',
      (err as any)?.message ?? err,
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  // --- Stripe webhook must receive raw body BEFORE json parser ---
  app.use('/billing/webhook', bodyParser.raw({ type: '*/*' }));
  app.use(bodyParser.json({ limit: '1mb' }));

  // --- Global validation (strict, safe) ---
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    validateCustomDecorators: true,
  }));

  await setupSwagger(app);

  if (process.env.NODE_ENV !== 'test') {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen(port);
     
    console.log(`API listening on http://localhost:${port}`);
  }

  return app;
}

bootstrap();