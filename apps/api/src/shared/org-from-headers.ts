import { BadRequestException } from '@nestjs/common';

export function orgFromHeaders(headers: Record<string, any>): string {
  // handle case-insensitive header access across frameworks
  const h = headers || {};
  const org =
    h['x-org'] ??
    h['X-Org'] ??
    h['x-org-slug'] ??
    h['X-Org-Slug'] ??
    h['x_org'] ??
    h['X_Org'];

  if (!org || typeof org !== 'string') {
    throw new BadRequestException('Missing X-Org header');
  }
  return org;
}