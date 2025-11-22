// apps/api/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core modules
import { AuthModule } from './modules/auth/auth.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';

// CRM modules
import { AccountsModule } from './modules/accounts/accounts.module';
import { ContactsModule } from './modules/contacts/contacts.module';

// System / infra
import { HealthModule } from './modules/health/health.module';
import { VersionModule } from './modules/version/version.module';

// Biz modules we’re wiring up now
import { BillingModule } from './modules/billing/billing.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    // Load env variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'prisma/.env'],
    }),

    // Core infra
    PrismaModule,
    AuthModule,
    OrgsModule,
    ProductsModule,

    // CRM
    AccountsModule,
    ContactsModule,

    // System
    HealthModule,
    VersionModule,

    // Biz modules
    BillingModule,
    CategoriesModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}