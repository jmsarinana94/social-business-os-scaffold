import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum ProductTypeDto {
  physical = 'physical',
  digital = 'digital',
}
export enum ProductStatusDto {
  active = 'active',
  inactive = 'inactive',
}

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProductTypeDto)
  type!: ProductTypeDto;

  @IsEnum(ProductStatusDto)
  status!: ProductStatusDto;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsString()
  sku?: string; // optional; we will auto-generate if missing
}