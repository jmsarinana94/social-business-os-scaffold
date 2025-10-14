export type ProductDto = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  sku: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: 'PHYSICAL' | 'DIGITAL';
  organizationId: string;
  categoryId: string | null;
  inventoryQty: number;
  createdAt: string;
  updatedAt: string;
};