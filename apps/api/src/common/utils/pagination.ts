export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export function paginate(total: number, page: number, limit: number): PaginationMeta {
  const safePage = Math.max(1, Number(page || 1));
  const safeLimit = Math.max(1, Number(limit || 10));
  return { page: safePage, limit: safeLimit, total };
}