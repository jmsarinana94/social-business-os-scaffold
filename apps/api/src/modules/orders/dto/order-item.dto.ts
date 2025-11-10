import { IsInt, IsOptional, IsString,Min } from 'class-validator';

export class OrderItemInputDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsInt()
  @Min(1)
  qty!: number;
}
