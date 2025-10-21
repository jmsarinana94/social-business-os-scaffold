import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module'; // ✅ new
import { OrgsModule } from './modules/orgs/orgs.module';
import { ProductsModule } from './modules/products/products.module';
import { QueueModule } from './modules/queue/queue.module'; // ✅ new

import { HealthController } from './common/health/health.controller';
import { MetricsController } from './common/metrics/metrics.controller';

import { AppLogger } from './common/logger/logger.service';
import { RequestContextMiddleware } from './common/request-context/request-context.middleware';
import { RequestContextModule } from './common/request-context/request-context.module';

@Module({
  imports: [
    RequestContextModule,
    PrismaModule,
    AuthModule,
    ProductsModule,
    OrgsModule,
    BillingModule, // ✅ safe if Stripe not configured
    QueueModule,   // ✅ safe if Redis not configured
  ],
  controllers: [HealthController, MetricsController],
  providers: [AppLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}