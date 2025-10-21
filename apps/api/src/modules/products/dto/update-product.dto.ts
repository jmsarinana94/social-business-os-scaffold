// apps/api/src/modules/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

/**
 * Make all CreateProduct fields optional, and ensure categoryId stays optional.
 * (PartialType already makes it optional, the explicit redeclare is just for clarity.)
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsString()
  categoryId?: string;
}