import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Log nothing by default; customize if you want
    super({ log: [] });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Helper that works whether your model is `model Org` (delegate: `org`)
   * or `model Organization` (delegate: `organization`).
   */
  async findOrgBySlug(slug: string) {
    const anyClient = this as any;
    const delegate = anyClient.org ?? anyClient.organization;
    if (!delegate) {
      throw new Error(
        'No Prisma delegate found for `Org` or `Organization`. Check your Prisma schema.',
      );
    }
    return delegate.findFirst({ where: { slug } });
  }
}