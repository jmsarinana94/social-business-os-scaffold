// apps/api/src/modules/products/dto/create-product.dto.ts
import { ProductStatus, ProductType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProductType)
  type!: ProductType;

  @IsEnum(ProductStatus)
  status!: ProductStatus;

  // Prisma uses Decimal, DTO accepts number
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'price must be a number' })
  price!: number;

  // Optional relation to Category within the same org
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  inventoryQty?: number;
}