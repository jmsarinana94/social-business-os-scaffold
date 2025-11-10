import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './modules/auth/auth.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
// import { AccountsModule } from './modules/accounts/accounts.module'; // <-- hold off for now

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'prisma/.env'],
    }),
    PrismaModule,
    AuthModule,
    OrgsModule,
    ProductsModule,
    // AccountsModule, // <-- comment out until Prisma model matches service
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}