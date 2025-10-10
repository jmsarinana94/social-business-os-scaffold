import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @IsNotEmpty()
  // simple slug guard (letters, numbers, dashes)
  @Matches(/^[a-z0-9-]+$/i, { message: 'slug must be letters, numbers, or dashes' })
  slug!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}