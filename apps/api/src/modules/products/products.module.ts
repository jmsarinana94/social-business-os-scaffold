import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { OrgsModule } from '../orgs/orgs.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule, OrgsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}