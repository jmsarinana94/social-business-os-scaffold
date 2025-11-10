import { prisma } from './prisma';

/**
 * Ensures an Organization with the given slug exists for tests.
 * If your schema requires `id` explicitly, pass it; otherwise omit it.
 */
export async function ensureOrg(options: { slug: string; name?: string; id?: string }) {
  const { slug, name = 'demo', id } = options;

  // Upsert by unique slug is simplest; switch to id if needed by your schema
  await prisma.organization.upsert({
    where: { slug },
    update: {},
    create: id ? { id, slug, name } : { slug, name },
  });
}