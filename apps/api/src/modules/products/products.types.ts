// apps/api/src/modules/products/products.types.ts
export type OrgContext = {
  id: string;
  slug: string;
};

export type RequestWithOrg = Request & { org?: OrgContext };

// simple pagination meta
export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type Paged<T> = { data: T[]; meta: PageMeta };