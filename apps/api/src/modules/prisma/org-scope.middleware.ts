import { Injectable } from '@nestjs/common';
import { RequestContextService } from '../../common/request-context/request-context.service';

/**
 * Prisma $use middleware to apply/validate org scoping.
 *
 * Default mode: "report-only" (does not mutate queries).
 * Set ENV `ORG_SCOPE_ENFORCE=true` to enforce at the DB layer.
 */
@Injectable()
export class OrgScopeMiddleware {
  private readonly enforce: boolean;

  constructor(private readonly ctx: RequestContextService) {
    this.enforce = String(process.env.ORG_SCOPE_ENFORCE || '').toLowerCase() === 'true';
  }

  /**
   * Registers the middleware on the Prisma client instance.
   * Typed as `any` for broad compatibility across Prisma versions.
   */
  register(client: any) {
    if (!client?.$use) return;

    client.$use(async (params: any, next: (p: any) => Promise<any>) => {
      // Only scope models that are org-bound. Extend as needed.
      const orgBoundModels = new Set(['Product', 'Order', 'Customer', 'Post', 'Campaign']);
      if (!orgBoundModels.has(params.model ?? '')) {
        return next(params);
      }

      const orgSlug = this.ctx.getOrgSlug();

      const actionsToScope = new Set([
        'findFirst',
        'findMany',
        'update',
        'updateMany',
        'delete',
        'deleteMany',
        'count',
        'aggregate',
      ]);

      if (!actionsToScope.has(params.action)) {
        return next(params);
      }

      if (!orgSlug) {
        if (this.enforce) {
          throw new Error(`ORG_SCOPE_ENFORCE is true but no orgSlug in context`);
        }
        return next(params);
      }

      if (!this.enforce) {
        // report-only: do not mutate the query
        return next(params);
      }

      const where = (params.args?.where ?? {}) as Record<string, any>;

      const alreadyScoped =
        where?.organization?.slug === orgSlug ||
        (Array.isArray((where as any).AND) &&
          (where as any).AND.some((w: any) => w?.organization?.slug === orgSlug));

      if (!alreadyScoped) {
        const scopedWhere = {
          AND: [where, { organization: { slug: orgSlug } }],
        };
        params.args = { ...(params.args || {}), where: scopedWhere };
      }

      return next(params);
    });
  }
}