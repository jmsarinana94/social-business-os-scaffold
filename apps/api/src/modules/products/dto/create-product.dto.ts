import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';

// Keep these enums aligned with your Prisma schema
export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductDto {
  @ApiProperty({ example: 'TSHIRT-BLK-M' })
  @IsString()
  @Length(1, 120)
  sku!: string;

  @ApiProperty({ example: 'T-Shirt Black (M)' })
  @IsString()
  @Length(1, 255)
  title!: string;

  @ApiProperty({ enum: ProductType, example: ProductType.PHYSICAL })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.ACTIVE })
  @IsEnum(ProductStatus)
  status!: ProductStatus;

  @ApiProperty({
    description: 'Price as number (supports integer cents or decimal).',
    example: 24.0,
  })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({
    description: 'Starting inventory for PHYSICAL goods (optional).',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  inventoryQty?: number;
}