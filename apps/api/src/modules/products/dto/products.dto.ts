import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

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
  @IsNotEmpty()
  title!: string;

  @IsEnum(ProductType)
  type!: ProductType;

  @IsEnum(ProductStatus)
  status!: ProductStatus;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price!: number;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  inventoryQty?: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  inventoryQty?: number;
}