import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateMinimalProductDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]+$/, { message: 'sku must contain only A-Z, 0-9, and hyphens' })
  sku!: string;
}