import { IsString, Matches } from 'class-validator';

export class CreateAnyDto {
  @IsString()
  @Matches(/^(?=.{1,64}$)[A-Za-z0-9-]+$/g, {
    message: 'sku must contain only letters, numbers, and hyphens',
  })
  sku!: string;
}