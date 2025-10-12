import {
    IsDecimal,
    IsEnum,
    IsOptional,
    IsString,
    ValidateIf,
} from 'class-validator';
import { ProductStatus, ProductType } from './product.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  // decimal string like "19.99"
  @IsOptional()
  @IsDecimal({ force_decimal: true }, { message: 'price must be a decimal string (e.g. "19.99")' })
  price?: string;

  /**
   * Send a string to set a category, or null to clear.
   * Only validate as string when it's not null.
   */
  @IsOptional()
  @ValidateIf((o) => o.categoryId !== null && o.categoryId !== undefined)
  @IsString()
  categoryId?: string | null;
}