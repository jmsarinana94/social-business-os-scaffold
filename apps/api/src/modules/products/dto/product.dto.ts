import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['physical', 'digital'])
  type!: 'physical' | 'digital';

  @IsString()
  @IsIn(['active', 'inactive'])
  status!: 'active' | 'inactive';

  // Accept number or string; normalize to 2 decimals
  @Transform(({ value }) => {
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) return Number(value).toFixed(2);
    return value;
  })
  @IsString()
  @Matches(/^\d+(\.\d{2})$/, { message: 'price must be a number with up to 2 decimals' })
  price!: string;

  @IsOptional()
  @IsString()
  sku?: string;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['physical', 'digital'])
  type?: 'physical' | 'digital';

  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @Transform(({ value }) => {
    if (value == null) return value;
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) return Number(value).toFixed(2);
    return value;
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{2})$/, { message: 'price must be a number with up to 2 decimals' })
  price?: string;

  @IsOptional()
  @IsString()
  sku?: string;
}