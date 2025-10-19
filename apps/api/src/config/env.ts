import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  PORT: z.string().optional(),
  THROTTLE_TTL: z.string().optional(),
  THROTTLE_LIMIT: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;