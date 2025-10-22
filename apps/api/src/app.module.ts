import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    AuthModule,
    OrgsModule,
    ProductsModule,
  ],
})
export class AppModule {}