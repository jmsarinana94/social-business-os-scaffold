import { IsInt } from 'class-validator';

export class AdjustInventoryDto {
  @IsInt()
  delta!: number; // positive or negative
}