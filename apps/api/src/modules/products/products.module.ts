import { Module } from '@nestjs/common';
import { OrgGuard } from '../../common/org.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, OrgGuard, JwtAuthGuard],
})
export class ProductsModule {}