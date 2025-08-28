import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
    IsIn,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
} from 'class-validator';
import { CreateProductDto } from './create-product.dto';

const PRODUCT_TYPES = ['physical', 'digital'] as const;
const PRODUCT_STATUSES = ['active', 'inactive'] as const;

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsIn(PRODUCT_TYPES as unknown as string[], {
    message: `type must be one of the following values: ${PRODUCT_TYPES.join(', ')}`,
  })
  type?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsIn(PRODUCT_STATUSES as unknown as string[], {
    message: `status must be one of the following values: ${PRODUCT_STATUSES.join(', ')}`,
  })
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(64)
  sku?: string;
}