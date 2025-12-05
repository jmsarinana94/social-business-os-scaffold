import { BadRequestException } from '@nestjs/common';

export type Org = { slug: string; id?: string };

/**
 * Read org slug from headers. Supertest/Node lowercases header keys.
 * Throws 400 when missing (expected by the e2e tests).
 */
export function orgFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): Org {
  const value =
    (headers['x-org'] as string) ??
    (headers['X-Org'] as unknown as string) ??
    (headers['X-ORG'] as unknown as string);

  if (!value) throw new BadRequestException('Missing X-Org header');
  return { slug: value };
}