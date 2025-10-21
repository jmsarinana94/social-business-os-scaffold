import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { OrgScopeMiddleware } from './org-scope.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly orgScope: OrgScopeMiddleware) {
    super();
  }

  async onModuleInit() {
    // Register org-scope middleware (report-only unless ORG_SCOPE_ENFORCE=true)
    this.orgScope.register(this as any);
    await this.$connect();
  }
}