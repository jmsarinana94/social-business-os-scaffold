import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { VersionController } from './version/version.controller';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule],
  controllers: [HealthController, VersionController],
})
export class AppModule {}