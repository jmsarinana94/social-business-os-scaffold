import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

const TYPES = ['PHYSICAL', 'DIGITAL'] as const;
const STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export type ProductType = typeof TYPES[number];
export type ProductStatus = typeof STATUSES[number];

export class CreateProductDto {
  @IsString() @IsNotEmpty()
  title!: string;

  @IsIn(TYPES as readonly string[])
  type!: ProductType;

  @IsIn(STATUSES as readonly string[])
  status!: ProductStatus;

  @Type(() => Number) @IsNumber()
  price!: number;

  @IsString() @IsNotEmpty()
  sku!: string;

  @IsOptional() @IsString()
  description?: string | null;

  @IsOptional() @Type(() => Number) @IsInt()
  inventoryQty?: number = 0;
}