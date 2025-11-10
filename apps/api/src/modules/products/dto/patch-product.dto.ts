import { IsInt } from 'class-validator';

export class PatchInventoryDto {
  @IsInt()
  delta!: number;
}