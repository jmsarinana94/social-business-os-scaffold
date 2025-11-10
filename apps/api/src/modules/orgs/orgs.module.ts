import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { OrgGuard } from './org.guard';
import { OrgsController } from './orgs.controller';
import { OrgsService } from './orgs.service';

/**
 * OrgsModule
 *
 * Provides organization CRUD logic, org-based context guard,
 * and API endpoints under /orgs.
 */
@Module({
  imports: [PrismaModule],
  controllers: [OrgsController],
  providers: [OrgsService, OrgGuard],
  exports: [OrgsService, OrgGuard],
})
export class OrgsModule {}