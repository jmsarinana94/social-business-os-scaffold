import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgsController } from './orgs.controller';
import { OrgsService } from './orgs.service';

@Module({
  controllers: [OrgsController],
  providers: [OrgsService, PrismaService],
  exports: [OrgsService],
})
export class OrgsModule {}