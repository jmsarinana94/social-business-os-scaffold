// apps/worker/src/index.ts
import { Queue, Worker } from 'bullmq';
import * as dotenv from 'dotenv';

dotenv.config();

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };

export const exampleQueue = new Queue('example', { connection });

new Worker(
  'example',
  async (job) => {
    console.warn('Processing job', job.id, job.name, job.data);
    // do work...
  },
  { connection },
);

// Helpful lifecycle logging within allowed methods
console.warn('Worker running. Redis:', connection.url);

// Optional: error handling that also complies with lint rules
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection in worker:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in worker:', err);
});
