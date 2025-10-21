import { Global, Module } from '@nestjs/common';
import { RequestContextModule } from '../../common/request-context/request-context.module';
import { OrgScopeMiddleware } from './org-scope.middleware';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [RequestContextModule],
  providers: [PrismaService, OrgScopeMiddleware],
  exports: [PrismaService],
})
export class PrismaModule {}