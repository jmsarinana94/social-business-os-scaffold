import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum ProductTypeDto {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
}
export enum ProductStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductDto {
  @IsString() title!: string;

  @IsEnum(ProductTypeDto) type!: ProductTypeDto;

  @IsEnum(ProductStatusDto) status!: ProductStatusDto;

  @IsNumber() @Min(0) price!: number;

  @IsString() sku!: string;

  @IsOptional() @IsString() description?: string | null;

  @IsOptional() @IsInt() @Min(0) inventoryQty?: number;
}

export class UpdateProductDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsEnum(ProductTypeDto) type?: ProductTypeDto;
  @IsOptional() @IsEnum(ProductStatusDto) status?: ProductStatusDto;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsInt() @Min(0) inventoryQty?: number;
}