import { IsNumber } from 'class-validator';

export class AdjustInventoryDto {
  @IsNumber()
  delta!: number;
}