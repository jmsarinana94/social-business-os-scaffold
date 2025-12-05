import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export type RequestContextStore = {
  orgSlug?: string | null;
  userId?: string | null;
};

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<RequestContextStore>();

  run<T>(store: RequestContextStore, cb: () => T) {
    return this.als.run(store, cb);
  }

  get<T extends keyof RequestContextStore>(key: T): RequestContextStore[T] {
    const store = this.als.getStore();
    return (store?.[key] ?? null) as any;
  }

  set<T extends keyof RequestContextStore>(key: T, value: RequestContextStore[T]) {
    const store = this.als.getStore();
    if (store) store[key] = value;
  }

  // Sugar
  getOrgSlug() {
    return this.get('orgSlug');
  }
  setOrgSlug(slug: string | null | undefined) {
    this.set('orgSlug', slug ?? null);
  }
}