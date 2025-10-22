import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

type Org = { id: string; slug: string; name: string; createdAt: Date; updatedAt: Date };

@Injectable()
export class OrgsService {
  private orgs = new Map<string, Org>();

  create(slug: string, name: string) {
    if (this.orgs.has(slug)) throw new ConflictException('Org already exists');
    const now = new Date();
    const org: Org = {
      id: 'org_' + Buffer.from(slug).toString('hex').slice(0, 8),
      slug,
      name,
      createdAt: now,
      updatedAt: now,
    };
    this.orgs.set(slug, org);
    return org;
  }

  get(slug: string) {
    const org = this.orgs.get(slug);
    if (!org) throw new NotFoundException('Org not found');
    return org;
  }
}