import { IsInt, IsNotEmpty } from 'class-validator';

export class InventoryAdjustDto {
  @IsInt()
  @IsNotEmpty()
  delta!: number;
}