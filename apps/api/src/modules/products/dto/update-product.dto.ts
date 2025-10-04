import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

// Export name **must** be UpdateProductDto because products.service imports it by that name.
export class UpdateProductDto extends PartialType(CreateProductDto) {}