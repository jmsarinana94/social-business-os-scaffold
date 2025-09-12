import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProductStatusDto, ProductTypeDto } from './create-product.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Transform(({ value }) => String(value).toUpperCase())
  @IsEnum(ProductTypeDto)
  type?: ProductTypeDto;

  @IsOptional()
  @Transform(({ value }) => String(value).toUpperCase())
  @IsEnum(ProductStatusDto)
  status?: ProductStatusDto;

  @IsOptional()
  @Transform(({ value }) => (value == null ? undefined : String(value)))
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}