import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
  SERVICE = 'SERVICE',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Create DTO — must allow minimal payloads (just { sku }) to pass,
 * because some tests POST only the SKU and rely on DB defaults.
 */
export class CreateProductDto {
  @IsString()
  @Matches(/^[A-Z0-9._-]+$/) // tests expect invalid "bad sku" to 400
  sku!: string;

  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional() @IsNumber()
  price?: number;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsInt() @Min(0)
  inventoryQty?: number;
}

export class UpdateProductPartialDto {
  @IsOptional() @IsString() @Matches(/^[A-Z0-9._-]+$/)
  sku?: string;

  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional() @IsNumber()
  price?: number;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsInt() @Min(0)
  inventoryQty?: number;
}

export class AdjustInventoryDto {
  @IsNumber()
  delta!: number;
}