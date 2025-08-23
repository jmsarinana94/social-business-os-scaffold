import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PRODUCT_REPOSITORY } from './products.tokens';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    { provide: PRODUCT_REPOSITORY, useValue: 'product' }, // <- token value
  ],
  exports: [ProductsService],
})
export class ProductsModule {}