import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type CreateAccountDto = {
  name: string;
  website?: string;
};

export type Account = {
  id: string;
  name: string;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
};

// In-memory store by org slug
const store = new Map<string, Account[]>();

const nowIso = () => new Date().toISOString();

@Injectable()
export class AccountsService {
  async list(orgSlug: string): Promise<Account[]> {
    return store.get(orgSlug) ?? [];
  }

  async create(orgSlug: string, _userId: string | null, dto: CreateAccountDto): Promise<Account> {
    const recs = store.get(orgSlug) ?? [];
    const account: Account = {
      id: randomUUID(),
      name: dto?.name ?? '',
      website: dto?.website ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    recs.unshift(account);
    store.set(orgSlug, recs);
    return account;
  }

  async get(orgSlug: string, id: string): Promise<Account> {
    const recs = store.get(orgSlug) ?? [];
    const found = recs.find((r) => r.id === id);
    if (!found) throw new NotFoundException('Account not found');
    return found;
  }
}