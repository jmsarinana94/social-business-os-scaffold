import {
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProductStatus, ProductType } from './product.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProductType) // "PHYSICAL" | "DIGITAL"
  type!: ProductType;

  @IsEnum(ProductStatus) // "ACTIVE" | "INACTIVE"
  status!: ProductStatus;

  // decimal string like "19.99"
  @IsDecimal({ force_decimal: true }, { message: 'price must be a decimal string (e.g. "19.99")' })
  price!: string;

  // optional category on create
  @IsOptional()
  @IsString()
  categoryId?: string;
}