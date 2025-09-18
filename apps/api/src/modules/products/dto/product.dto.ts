import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

function toUpperString(v: unknown): string | undefined {
  if (typeof v === 'string') return v.toUpperCase();
  return undefined;
}
function toLowerString(v: unknown): string | undefined {
  if (typeof v === 'string') return v.toLowerCase();
  if (typeof v === 'number') return String(v).toLowerCase();
  return undefined;
}

export class ProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title!: string;

  @IsIn(['PHYSICAL', 'DIGITAL'])
  @Transform(({ value }: { value: unknown }) => toUpperString(value))
  type!: 'PHYSICAL' | 'DIGITAL';

  @IsIn(['ACTIVE', 'INACTIVE'])
  @Transform(({ value }: { value: unknown }) => toUpperString(value))
  status!: 'ACTIVE' | 'INACTIVE';

  // Keep as string for presentation; numeric is handled in create/update DTOs.
  @IsString()
  @Matches(/^\d+(\.\d+)?$/)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'number'
      ? String(value)
      : typeof value === 'string'
      ? value.trim()
      : value,
  )
  price!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const t = value.trim();
      return t === '' ? undefined : t;
    }
    return undefined;
  })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Transform(({ value }: { value: unknown }) => toLowerString(value))
  sku?: string;
}