import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// SKU stays immutable in this scaffold to avoid 409 churn on updates.
export class UpdateProductDto extends PartialType(CreateProductDto) {}