import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../prisma/prisma.service';
import { REQUIRED_PLAN } from './required-plan.decorator';

const planRank: Record<string, number> = { FREE: 0, STARTER: 1, GROWTH: 2, ENTERPRISE: 3 };

@Injectable()
export class BillingGuard implements CanActivate {
  private readonly logger = new Logger(BillingGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(PrismaService) @Optional() private readonly prisma?: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<string>(REQUIRED_PLAN, context.getHandler());
    if (!required) return true; // no requirement set

    // If Prisma isn’t available or schema not migrated yet, allow (non-breaking).
    if (!this.prisma) return true;

    const req = context.switchToHttp().getRequest();
    // Expect the current org slug from your existing header helper (X-Org)
    const orgSlug = req.headers['x-org'] as string | undefined;
    if (!orgSlug) return true; // don’t block if no org context (or make this stricter later)

    try {
      const org = await this.prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { subscriptionPlan: true, subscriptionStatus: true },
      });

      // If org missing or no plan yet → treat as FREE
      const have = org?.subscriptionPlan ?? 'FREE';
      const ok = planRank[have] >= planRank[required];

      if (!ok) {
        throw new ForbiddenException(`Requires plan ${required}. Current plan: ${have}`);
      }
      // Optionally validate active status:
      // if (org?.subscriptionStatus && !['active', 'trialing'].includes(org.subscriptionStatus)) { ... }

      return true;
    } catch (e: any) {
      // If column missing (pre-migration), don’t block usage
      this.logger.warn(`BillingGuard soft-failed: ${e?.message ?? e}`);
      return true;
    }
  }
}