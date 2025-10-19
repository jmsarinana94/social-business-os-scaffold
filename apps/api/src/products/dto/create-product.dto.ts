// apps/api/src/products/dto/create-product.dto.ts
export class CreateProductDto {
  title!: string;
  sku!: string;
  description?: string;
  type?: string;     // narrow to your enum later if desired
  status?: string;   // same as above
  price!: number;    // required
  inventoryQty?: number;
}