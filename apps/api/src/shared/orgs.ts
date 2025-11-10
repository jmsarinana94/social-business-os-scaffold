import { BadRequestException } from '@nestjs/common';

export type Org = { id?: string; slug: string };

export const ORG_HEADER = 'x-org';

/**
 * Extract the org slug from headers. Throws 400 if missing.
 * This matches the e2e tests that expect a 400 when X-Org is not provided.
 */
export function orgFromHeaders(headers: Record<string, any>): Org {
  // Try common casings just in case
  const slug =
    headers?.[ORG_HEADER] ??
    headers?.[ORG_HEADER.toUpperCase()] ??
    headers?.['X-Org'] ??
    headers?.['x-Org'];

  if (!slug || typeof slug !== 'string') {
    throw new BadRequestException('Missing X-Org header');
  }

  return { slug };
}