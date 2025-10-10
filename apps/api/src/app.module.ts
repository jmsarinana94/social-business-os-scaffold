import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { ProductsModule } from './modules/products/products.module';

import { OrgHeaderGuard } from './common/org-header.guard';
import { PrismaModule } from './common/prisma.module';

@Module({
  imports: [
    // Make PrismaService available app-wide
    PrismaModule,

    // Rate limiting (safe defaults)
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'default', ttl: 60_000, limit: 300 },
    ]),

    // Feature modules
    OrgsModule,
    AuthModule,
    ProductsModule,
  ],
  providers: [
    // Enforce X-Org header on scoped routes
    { provide: APP_GUARD, useClass: OrgHeaderGuard },
  ],
})
export class AppModule {}