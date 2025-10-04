import { IsInt } from 'class-validator';

export class InventoryAdjustDto {
  // Positive or negative whole number. Example: +5, -2
  @IsInt()
  delta!: number;
}