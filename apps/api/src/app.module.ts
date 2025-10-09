import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    // Global Prisma provider (database access)
    PrismaModule,

    // Feature modules
    AuthModule,
    ProductsModule,
    HealthModule,

    // NOTE:
    // If you later re-add OpenAPI (Swagger) or any other modules,
    // import them here once they’re available again.
  ],
})
export class AppModule {}