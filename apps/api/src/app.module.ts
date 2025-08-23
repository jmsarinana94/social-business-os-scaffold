import { GlobalHttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { RequestIdMiddleware } from '@common/middleware/request-id.middleware';
import { ProductsModule } from '@modules/products/products.module';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [ProductsModule],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: GlobalHttpExceptionFilter },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}