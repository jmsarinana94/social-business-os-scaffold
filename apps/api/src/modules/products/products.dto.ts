import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

  // allow client to provide SKU or omit it (service will generate one)
  @IsString()
  @IsOptional()
  sku?: string;

  @IsEnum(ProductType)
  type!: ProductType;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  // accept "19.99" or 19.99 and normalize to number
  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  price!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  inventoryQty?: number;

  // this is what was missing and caused 400 when tests send { description: '...' }
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

// POST /products/:id/inventory { delta }
export class AdjustInventoryDto {
  @IsInt()
  @IsNotEmpty()
  delta!: number;
}