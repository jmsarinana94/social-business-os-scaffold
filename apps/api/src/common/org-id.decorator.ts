import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Normalize an org id into a stable slug */
export function normalizeOrg(raw?: string | string[]): string {
  const val = Array.isArray(raw) ? raw[0] : raw;
  const base = (val ?? '').toString().trim();
  const lowered = base.toLowerCase().replace(/\s+/g, '-');
  const cleaned = lowered.replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return cleaned || 'default';
}

/**
 * Reads X-Org-Id header (case-insensitive). Falls back to process.env.ORG.
 * Returns a normalized slug string. If not provided and not optional -> 400.
 */
export const OrgId = createParamDecorator(
  (data: { optional?: boolean } | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    const fromHeader =
      req.headers['x-org-id'] ||
      req.headers['x_org_id'] ||
      req.headers['x-orgid'];

    const fallback = process.env.ORG;

    const normalized = normalizeOrg(
      typeof fromHeader === 'string'
        ? fromHeader
        : Array.isArray(fromHeader)
        ? fromHeader[0]
        : fallback,
    );

    if (!normalized && !(data && data.optional)) {
      throw new BadRequestException(['x-org-id header is required']);
    }

    return normalized;
  },
);