import { Transform, Type } from 'class-transformer';
import {
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
} from 'class-validator';

const PRODUCT_TYPES = ['physical', 'digital'] as const;
const PRODUCT_STATUSES = ['active', 'inactive'] as const;

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsIn(PRODUCT_TYPES as unknown as string[], {
    message: `type must be one of the following values: ${PRODUCT_TYPES.join(', ')}`,
  })
  type!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsIn(PRODUCT_STATUSES as unknown as string[], {
    message: `status must be one of the following values: ${PRODUCT_STATUSES.join(', ')}`,
  })
  status!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price!: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(64)
  sku?: string;
}