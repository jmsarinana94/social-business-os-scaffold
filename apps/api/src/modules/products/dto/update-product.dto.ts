import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProductStatus, ProductType } from './create-product.dto';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inventoryQty?: number;

  @IsString()
  @IsOptional()
  description?: string;
}