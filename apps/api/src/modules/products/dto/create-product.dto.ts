import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
}
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductDto {
  @IsString()
  sku!: string;

  @IsString()
  title!: string;

  @IsEnum(ProductType)
  type!: ProductType;

  @IsEnum(ProductStatus)
  status!: ProductStatus;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryQty?: number;
}