import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/** PATCH/PUT “partial” DTO */
export class UpdateProductPartialDto extends PartialType(CreateProductDto) {}