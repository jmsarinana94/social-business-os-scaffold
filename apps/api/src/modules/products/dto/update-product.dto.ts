import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  // add missing optional inventory for partial updates
  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryQty?: number;
}