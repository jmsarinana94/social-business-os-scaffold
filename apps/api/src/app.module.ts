import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrgMiddleware } from './common/middleware/org.middleware';
import { PrismaService } from './prisma/prisma.service';

import { HealthController } from './health.controller';
import { ProductsController } from './modules/products/products.controller';
import { ProductsService } from './modules/products/products.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HealthController, ProductsController],
  providers: [PrismaService, ProductsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OrgMiddleware).forRoutes(ProductsController);
  }
}