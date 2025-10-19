import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * Reads org slug from:
 *   1) X-Org header (primary)
 *   2) body.org (fallback)
 *
 * Skips guard entirely for /auth routes to allow signup/login to work
 * while still letting the controller read org from body.
 */
@Injectable()
export class OrgHeaderGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req: Request & { orgSlug?: string } = context.switchToHttp().getRequest();

    const url = req.url || '';
    // Allow auth routes to pass without enforcing X-Org
    if (url.startsWith('/auth')) {
      // If body has org, attach for downstream convenience
      const bodyOrg =
        (req.body && (req.body.org || req.body.slug || req.body.organization)) || undefined;
      if (typeof bodyOrg === 'string' && bodyOrg.trim()) {
        req.orgSlug = bodyOrg.trim().toLowerCase();
      }
      return true;
    }

    const headerOrg = (req.headers['x-org'] as string | undefined)?.trim();
    const bodyOrg =
      (req.body && (req.body.org || req.body.slug || req.body.organization)) || undefined;
    const candidate = headerOrg || (typeof bodyOrg === 'string' ? bodyOrg.trim() : undefined);

    if (!candidate) {
      throw new BadRequestException(
        'Missing organization. Provide header "X-Org: <slug>" or body.org.',
      );
    }

    req.orgSlug = candidate.toLowerCase();
    return true;
  }
}