import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ProductTypeDto {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
}

export enum ProductStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsString()
  title!: string;

  @Transform(({ value }) => String(value).toUpperCase())
  @IsEnum(ProductTypeDto)
  type!: ProductTypeDto;

  @Transform(({ value }) => String(value).toUpperCase())
  @IsEnum(ProductStatusDto)
  status!: ProductStatusDto;

  // tests sometimes send number; store as string consistently
  @Transform(({ value }) => (value == null ? undefined : String(value)))
  @IsString()
  price!: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}