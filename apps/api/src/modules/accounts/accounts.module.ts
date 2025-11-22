// apps/api/src/modules/accounts/accounts.module.ts

import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgGuard } from '../orgs/org.guard';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  controllers: [AccountsController],
  providers: [
    AccountsService,
    PrismaService, // Needed for resolving org slug → orgId inside controller
    OrgGuard,      // Guard must be injectable
  ],
  exports: [AccountsService],
})
export class AccountsModule {}