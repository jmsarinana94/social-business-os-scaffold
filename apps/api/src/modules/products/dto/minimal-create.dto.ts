import { IsString, Matches } from 'class-validator';

export class MinimalCreateDto {
  @IsString()
  @Matches(/^[A-Z0-9-]{3,64}$/)
  sku!: string;
}