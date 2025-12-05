// apps/api/src/modules/contacts/contacts.module.ts

import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgGuard } from '../orgs/org.guard';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  controllers: [ContactsController],
  providers: [
    ContactsService,
    PrismaService,
    OrgGuard,
  ],
  exports: [ContactsService],
})
export class ContactsModule {}