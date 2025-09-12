import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import IORedis, { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  get instance(): Redis {
    return this.client;
  }

  async onModuleInit() {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.client = new IORedis(url, { lazyConnect: true, maxRetriesPerRequest: null });
    await this.client.connect();
    console.log('[Redis] connected:', url);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}