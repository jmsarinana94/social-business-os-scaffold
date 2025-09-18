import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,   // global PrismaService provider
    AuthModule,
    ProductsModule,
    HealthModule,
    // NOTE: If you later re-add your OpenAPI docs module,
    // import it here once the file exists again.
  ],
})
export class AppModule {}