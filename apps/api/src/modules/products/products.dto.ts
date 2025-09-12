// src/modules/products/products.dto.ts
import { IsNumberString, IsOptional, IsString, Length } from 'class-validator';

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsNumberString() // we accept "39.99" as string
  price!: string;

  @IsString() // raw string; service maps to enum
  type!: string; // "physical" | "digital"

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @Length(1, 64)
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  status?: string; // "active" | "inactive"
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumberString()
  @IsOptional()
  price?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @Length(1, 64)
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  status?: string;
}