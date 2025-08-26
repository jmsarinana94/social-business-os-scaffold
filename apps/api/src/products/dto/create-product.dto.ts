import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsEnum(['physical', 'digital'] as any)
  type!: 'physical' | 'digital';

  @IsEnum(['active', 'inactive'] as any)
  status!: 'active' | 'inactive';

  @IsInt()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  inventoryQty?: number;

  @IsString()
  @IsOptional()
  description?: string | null;
}