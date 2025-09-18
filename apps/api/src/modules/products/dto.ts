import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
} from 'class-validator';

/**
 * Accept friendly lowercase strings and map them to Prisma enums in the service.
 * IMPORTANT: your Prisma enum supports only PHYSICAL | DIGITAL and ACTIVE | INACTIVE.
 */
export class CreateProductDto {
  @ApiProperty({ example: 'Widget' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({
    enum: ['physical', 'digital'],
    example: 'physical',
    description: 'Lowercase input; mapped to Prisma enum internally.',
  })
  @IsString()
  @IsIn(['physical', 'digital'])
  @Transform(({ value }) => String(value).toLowerCase())
  type!: 'physical' | 'digital';

  @ApiPropertyOptional({
    enum: ['active', 'inactive'],
    example: 'active',
    description: 'Lowercase input; mapped to Prisma enum internally.',
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  @Transform(({ value }) => (value == null ? value : String(value).toLowerCase()))
  status?: 'active' | 'inactive';

  @ApiProperty({ example: 12.99 })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiPropertyOptional({ example: 'Optional description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'SKU-ABC-123' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ enum: ['physical', 'digital'] })
  @IsOptional()
  @IsString()
  @IsIn(['physical', 'digital'])
  @Transform(({ value }) => (value == null ? value : String(value).toLowerCase()))
  type?: 'physical' | 'digital';

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  @Transform(({ value }) => (value == null ? value : String(value).toLowerCase()))
  status?: 'active' | 'inactive';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;
}