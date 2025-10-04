// apps/api/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // make PrismaService available app-wide (optional but convenient)
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}