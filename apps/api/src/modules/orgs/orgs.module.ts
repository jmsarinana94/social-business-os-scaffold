import { Module } from '@nestjs/common';
import { OrgGuard } from './org.guard';
import { OrgsController } from './orgs.controller';
import { OrgsService } from './orgs.service';

@Module({
  providers: [OrgGuard, OrgsService],
  controllers: [OrgsController],
  exports: [OrgGuard, OrgsService],
})
export class OrgsModule {}