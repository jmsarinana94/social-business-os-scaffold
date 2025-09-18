import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
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
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsDefined()
  @IsEnum(ProductType)
  type!: ProductType;

  @IsEnum(ProductStatus)
  @IsOptional()
  status: ProductStatus = ProductStatus.ACTIVE;

  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inventoryQty?: number;

  @IsString()
  @IsOptional()
  description?: string;
}