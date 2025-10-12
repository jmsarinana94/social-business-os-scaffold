import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AdjustInventoryDto {
  @Type(() => Number) @IsInt()
  delta!: number;
}