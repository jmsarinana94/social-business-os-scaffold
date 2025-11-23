// apps/api/src/modules/orders/dto/create-order.dto.ts

import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class OrderItemInputDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  // qty required, >= 1
  @IsInt()
  @IsPositive()
  quantity!: number;

  // NOTE: client may send unitPrice, but the server will ignore it and
  // always use the product’s current DB price. Kept here only for forward-compat.
  @IsOptional()
  unitPrice?: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  // Optional customer email etc. (not persisted in this minimal schema)
  @IsOptional()
  @IsString()
  customerEmail?: string;
}

export class ListOrdersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}