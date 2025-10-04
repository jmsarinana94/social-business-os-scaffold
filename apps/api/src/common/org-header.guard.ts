// apps/api/src/common/org-header.guard.ts
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

export const ORG_HEADER = 'x-org-id';

/**
 * Validates that the incoming request has an x-org-id header and
 * stores it on req.orgId for downstream handlers/controllers.
 *
 * This guard does NOT touch the database. Your schema uses a plain
 * string orgId on resources (e.g., Product), so there is no
 * Organization model to upsert.
 */
@Injectable()
export class OrgHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // Header lookup (be tolerant of case)
    const rawHeader =
      req.headers[ORG_HEADER] ??
      req.headers[ORG_HEADER.toLowerCase()] ??
      req.headers[ORG_HEADER.toUpperCase()];

    const orgId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!orgId || typeof orgId !== 'string' || !orgId.trim()) {
      throw new BadRequestException(
        `Missing required header: ${ORG_HEADER}`,
      );
    }

    // Attach to request for controllers/services to use
    req.orgId = orgId.trim();

    return true;
  }
}