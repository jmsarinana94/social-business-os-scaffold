import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

const PRODUCT_TYPES = ['PHYSICAL', 'DIGITAL'] as const;
const PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export class CreateProductDto {
  @IsString()
  sku!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // keep as string enums to match your current schema
  @IsString()
  @IsIn(PRODUCT_TYPES as unknown as string[])
  type!: (typeof PRODUCT_TYPES)[number];

  @IsString()
  @IsIn(PRODUCT_STATUSES as unknown as string[])
  status!: (typeof PRODUCT_STATUSES)[number];

  // price comes in as JSON number; coerce & validate
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  // optional; defaulted to 0 in service if omitted
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryQty?: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}