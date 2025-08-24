import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { PrismaModule } from './prisma/prisma.module';

// IMPORTANT: No global guards here. We’ll add them later with @Public().
@Module({
  imports: [
    PrismaModule,
    ProductsModule,
    AuthModule,
  ],
})
export class AppModule {}