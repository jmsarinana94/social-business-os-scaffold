import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProductStatusDto, ProductTypeDto } from './create-product.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsEnum(ProductStatusDto)
  status?: ProductStatusDto;

  @IsOptional()
  @IsEnum(ProductTypeDto)
  type?: ProductTypeDto;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inventoryQty?: number;
}