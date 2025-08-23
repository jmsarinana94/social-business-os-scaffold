import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// Prisma v6: default export pattern
import PrismaPkg from '@prisma/client';

const { PrismaClient } = PrismaPkg;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}