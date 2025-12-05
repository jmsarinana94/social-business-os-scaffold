import { Injectable, Logger } from '@nestjs/common';

type BullMQLike = {
  Queue: any;
  Worker: any;
  QueueEvents: any;
};

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private bull: BullMQLike | null = null;
  private connection: any = null;

  private get isConfigured() {
    return !!process.env.REDIS_URL;
  }

  /** lazy import bullmq only when needed */
  private async loadBull(): Promise<BullMQLike | null> {
    if (!this.isConfigured) {
      this.logger.warn('Redis not configured (missing REDIS_URL). Queue is disabled.');
      return null;
    }
    if (this.bull) return this.bull;

    const bullmq = (await import('bullmq')) as any;
    this.bull = {
      Queue: bullmq.Queue,
      Worker: bullmq.Worker,
      QueueEvents: bullmq.QueueEvents,
    };
    this.connection = { connection: { url: process.env.REDIS_URL } };
    return this.bull;
  }

  async getQueue(name: string) {
    const bull = await this.loadBull();
    if (!bull) return null;
    return new bull.Queue(name, this.connection);
  }

  async add(name: string, data: any, opts?: any) {
    const queue = await this.getQueue(name);
    if (!queue) return { id: `fake_job_${Date.now()}`, stub: true };
    return queue.add(name, data, opts);
  }

  async startWorker(name: string, handler: (job: any) => Promise<any>) {
    const bull = await this.loadBull();
    if (!bull) return null;
    const worker = new bull.Worker(name, handler, this.connection);
    worker.on('failed', (job: any, err: any) => this.logger.error(`Job ${job?.id} failed: ${err?.message}`));
    worker.on('completed', (job: any) => this.logger.debug(`Job ${job?.id} completed`));
    return worker;
  }
}