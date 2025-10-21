import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiProperty({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  status!: ProductStatus;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryQty?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sku!: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  // Keep optional inventoryQty here so service can compile even if not used in PATCH /:id
  @IsOptional()
  @IsInt()
  @Min(0)
  override inventoryQty?: number;
}

export class PatchInventoryDto {
  @ApiProperty({ description: 'Positive or negative change in inventory' })
  @IsInt()
  delta!: number;
}

// Shape used for responses
export class ProductDto {
  id!: string;
  sku!: string;
  title!: string;
  type!: ProductType;
  status!: ProductStatus;
  price!: number;            // ensure number in responses
  description!: string | null;
  inventoryQty!: number;
}