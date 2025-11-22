// apps/api/src/modules/orders/orders.module.ts

import { Module } from '@nestjs/common';

import { OrgsModule } from '../orgs/orgs.module';
import { PrismaModule } from '../prisma/prisma.module';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, OrgsModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}