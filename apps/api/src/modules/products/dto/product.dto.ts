import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ProductQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit = 10;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsString()
  type?: string;
}

export class ProductCreateDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string | null;
  @IsIn(['active', 'inactive']) status!: 'active' | 'inactive';
  @IsString() type!: string;          // required by Prisma schema
  @IsOptional() @Type(() => Number) @IsNumber() price?: number;
}

export class ProductUpdateDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsIn(['active', 'inactive']) status?: 'active' | 'inactive';
  @IsOptional() @IsString() type?: string;
  @IsOptional() @Type(() => Number) @IsNumber() price?: number;
}