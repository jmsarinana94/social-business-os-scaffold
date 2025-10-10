import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { ProductsModule } from './modules/products/products.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [AuthModule, ProductsModule, OrgsModule],
  providers: [PrismaService],
})
export class AppModule {}