import { createHash } from 'crypto';

export function stableHash(input: unknown): string {
  const json = typeof input === 'string' ? input : JSON.stringify(input ?? null);
  return createHash('sha256').update(json).digest('hex');
}