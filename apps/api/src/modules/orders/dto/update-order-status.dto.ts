// apps/api/src/modules/orders/dto/update-order-status.dto.ts
import { IsEnum } from 'class-validator';

export enum OrderStatusDto {
  pending_payment = 'pending_payment',
  paid = 'paid',
  fulfilled = 'fulfilled',
  canceled = 'canceled',
  refunded = 'refunded',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusDto)
  status!: OrderStatusDto;
}