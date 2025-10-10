import { Module } from '@nestjs/common';
import { OrgsController } from './orgs.controller';
import { OrgsService } from './orgs.service';

// PrismaService is provided by the global PrismaModule imported in AppModule
@Module({
  controllers: [OrgsController],
  providers: [OrgsService],
  exports: [OrgsService],
})
export class OrgsModule {}