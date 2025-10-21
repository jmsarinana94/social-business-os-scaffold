export type ProductDto = {
  id: string;
  sku: string;
  title: string;
  type: 'PHYSICAL' | 'DIGITAL';
  status: 'ACTIVE' | 'INACTIVE';
  price: number;              // ensure number (tests expect number)
  description: string | null;
  inventoryQty: number;       // default 0
  createdAt?: string;
  updatedAt?: string;
};

// A tiny mapper to ensure price is a number (Prisma Decimal -> number) and
// to normalize nullables.
export const toProductDto = (row: any): ProductDto => ({
  id: row.id,
  sku: row.sku,
  title: row.title,
  type: row.type,
  status: row.status,
  price: typeof row.price === 'number' ? row.price : Number(row.price),
  description: row.description ?? null,
  inventoryQty: row.inventoryQty ?? 0,
  createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
  updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
});