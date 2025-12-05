// apps/api/src/modules/version/version.module.ts

import { Module } from '@nestjs/common';
import { VersionController } from './version.controller';

@Module({
  controllers: [VersionController],
})
export class VersionModule {}