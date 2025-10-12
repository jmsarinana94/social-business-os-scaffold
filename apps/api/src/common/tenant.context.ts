import { AsyncLocalStorage } from 'node:async_hooks';

type TenantStore = { orgId?: string };

class TenantContextCls {
  private als = new AsyncLocalStorage<TenantStore>();

  runWithOrg<T>(orgId: string | undefined, fn: () => T) {
    this.als.run({ orgId }, fn);
  }

  getOrgId(): string | undefined {
    const store = this.als.getStore();
    return store?.orgId;
  }
}

export const TenantContext = new TenantContextCls();