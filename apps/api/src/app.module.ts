// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './common/prisma.module';
import { TenantMiddleware } from './common/tenant.middleware';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({ isGlobal: true }),

    // Global Prisma provider (via @Global() PrismaModule)
    PrismaModule,

    // App features
    AuthModule,
    OrgsModule,
    ProductsModule,
  ],
  // If you later add a global guard/interceptor, register it here with APP_GUARD/APP_INTERCEPTOR.
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}