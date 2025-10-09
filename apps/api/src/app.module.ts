import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Load env for the API at runtime (global)
    // First try the Prisma .env used in this repo, then root .env as a fallback.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/prisma/.env', '.env'],
    }),

    PrismaModule,
    AuthModule,
    ProductsModule,
  ],
})
export class AppModule {}