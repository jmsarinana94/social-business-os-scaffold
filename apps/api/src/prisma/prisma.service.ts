import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions>
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: process.env.NODE_ENV === 'test' ? [] : ['warn', 'error'],
    } as Prisma.PrismaClientOptions);

    this.setupProcessListeners();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private setupProcessListeners() {
    const disconnect = async () => {
      try { await this.$disconnect(); } catch {}
    };
    process.on('beforeExit', disconnect);
    process.on('SIGINT', disconnect);
    process.on('SIGTERM', disconnect);
    process.on('SIGUSR2', async () => {
      await disconnect();
      process.kill(process.pid, 'SIGUSR2');
    });
  }
}