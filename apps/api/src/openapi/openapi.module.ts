import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export class OpenApiModule {
  static setup(app: INestApplication) {
    const title = process.env.SWAGGER_TITLE ?? 'Social Business OS – API';
    const desc =
      process.env.SWAGGER_DESCRIPTION ??
      'REST API for auth, products, and inventory with multi-tenant org support.';
    const version = process.env.SWAGGER_VERSION ?? '0.1.0';

    const config = new DocumentBuilder()
      .setTitle(title)
      .setDescription(desc)
      .setVersion(version)
      // Bearer JWT for /auth/login token
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'bearer',
      )
      // Common header we use to route to an org/tenant
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-org',
          in: 'header',
          description: 'Organization slug or id',
        },
        'x-org',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true,
    });

    SwaggerModule.setup('/docs', app, document, {
      jsonDocumentUrl: '/docs/openapi.json',
      customSiteTitle: `${title} Docs`,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });
  }
}