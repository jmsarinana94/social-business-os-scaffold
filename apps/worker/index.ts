// apps/worker/index.ts
import type { JobsOptions } from 'bullmq';
import { Queue, QueueEvents, Worker } from 'bullmq';
import * as dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = process.env.WORK_QUEUE_NAME || 'example';

const connection = { url: redisUrl };

async function main() {
  // Create queue (for enqueuing jobs)
  const queue = new Queue(QUEUE_NAME, { connection });

  // Optional: queue events
  const events = new QueueEvents(QUEUE_NAME, { connection });
  events.on('completed', ({ jobId }) => {
    console.log(`[queue] job ${jobId} completed`);
  });
  events.on('failed', ({ jobId, failedReason }) => {
    console.error(`[queue] job ${jobId} failed: ${failedReason}`);
  });
  events.on('error', (err) => {
    console.error('[queue-events] error', err);
  });

  // Important: wait until ready to avoid race conditions
  await events.waitUntilReady();

  // Worker: processes jobs
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      console.log('[worker] Processing job', job.id, job.name, job.data);
      // Simulate work
      await new Promise((r) => setTimeout(r, 500));
      return { ok: true };
    },
    { connection },
  );

  worker.on('error', (err) => {
    console.error('[worker] error', err);
  });

  await worker.waitUntilReady();

  console.log(`[worker] Running. Redis: ${redisUrl}, queue: ${QUEUE_NAME}`);

  // Optional demo: enqueue a sample job when env flag is set
  if (process.env.ENQUEUE_DEMO === '1') {
    const opts: JobsOptions = { removeOnComplete: 100, removeOnFail: 100 };
    const job = await queue.add('demo-job', { hello: 'world', ts: Date.now() }, opts);
    console.log('[enqueue] demo job added', job.id);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[worker] ${signal} received, closing...`);
    await Promise.allSettled([worker.close(), events.close(), queue.close()]);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[bootstrap] fatal error:', err);
  process.exit(1);
});
