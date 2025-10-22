import { IsInt } from 'class-validator';

export class InventoryDeltaDto {
  @IsInt()
  delta!: number;
}