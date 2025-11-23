import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({
    example: 'prod_123',
    description: 'ID of the product being ordered',
  })
  @IsString()
  productId!: string;

  @ApiProperty({
    example: 1,
    description: 'Quantity of this product',
  })
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiProperty({
    example: 1999,
    description: 'Unit price in cents (e.g. 1999 = $19.99)',
  })
  @IsInt()
  @Min(0)
  unitPriceCents!: number;
}

export class CreateOrderDto {
  @ApiProperty({
    type: () => [CreateOrderItemDto],
    description: 'Line items for this order',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty({
    example: 'USD',
    required: false,
    description: 'ISO currency code; defaults to USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}