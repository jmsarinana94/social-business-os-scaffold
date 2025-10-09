import { Type } from 'class-transformer';
import { IsInt, NotEquals } from 'class-validator';

export class InventoryAdjustDto {
  @Type(() => Number)
  @IsInt()
  @NotEquals(0, { message: 'delta must be non-zero' })
  delta!: number;
}