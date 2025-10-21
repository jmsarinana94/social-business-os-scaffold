import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

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
  @MaxLength(128)
  sku!: string;

  @IsString()
  @MaxLength(256)
  title!: string;

  @IsEnum(ProductType)
  type!: ProductType;

  @IsEnum(ProductStatus)
  status!: ProductStatus;

  // Tests expect number, not string
  @IsNumber()
  @IsPositive()
  price!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryQty?: number; // optional on create; default 0 if omitted
}